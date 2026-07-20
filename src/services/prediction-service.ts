import { createClient } from "@/lib/supabase/client";
import type { PredictionSettings, PredictionUser, PredictionEntry, LeaderboardEntry, PredictionEventMatch } from "@/lib/prediction-types";

export async function getPredictionSettings(eventId: string): Promise<PredictionSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prediction_settings")
    .select("*")
    .eq("event_id", eventId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertPredictionSettings(
  eventId: string,
  settings: Partial<PredictionSettings>
): Promise<PredictionSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prediction_settings")
    .upsert(
      { event_id: eventId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: "event_id" }
    )
    .select()
    .single();
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
  return data;
}

export async function getPredictionEntries(
  eventId: string,
  username?: string
): Promise<PredictionEntry[]> {
  const supabase = createClient();
  let query = supabase
    .from("prediction_entries")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });
  if (username) query = query.eq("discord_username", username);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function upsertPredictionEntry(
  entry: Omit<PredictionEntry, "id" | "is_correct" | "created_at">
): Promise<PredictionEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prediction_entries")
    .upsert(entry, { onConflict: "match_id,discord_username" })
    .select()
    .single();
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
  return data;
}

export async function bulkUpsertPredictions(
  entries: Array<Omit<PredictionEntry, "id" | "is_correct" | "created_at">>
): Promise<PredictionEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prediction_entries")
    .upsert(entries, { onConflict: "match_id,discord_username" })
    .select();
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
  return data || [];
}

export async function getOrCreatePredictionUser(username: string): Promise<PredictionUser> {
  const supabase = createClient();
  const trimmed = username.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("prediction_users")
    .select("*")
    .eq("discord_username", trimmed)
    .single();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("prediction_users")
    .insert({ discord_username: trimmed })
    .select()
    .single();
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
  return data;
}

export async function getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  const { data: entries, error: entriesError } = await supabase
    .from("prediction_entries")
    .select("discord_username")
    .eq("event_id", eventId);
  if (entriesError) throw entriesError;

  const uniqueUsernames = [...new Set((entries || []).map((e: { discord_username: string }) => e.discord_username))];
  if (uniqueUsernames.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("prediction_users")
    .select("*")
    .in("discord_username", uniqueUsernames);
  if (usersError) throw usersError;

  const sorted = (users || [])
    .sort((a: PredictionUser, b: PredictionUser) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.correct_predictions !== a.correct_predictions) return b.correct_predictions - a.correct_predictions;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .map((user: PredictionUser, index: number) => ({
      rank: index + 1,
      discord_username: user.discord_username,
      points: user.points,
      accuracy: user.accuracy,
      correct_predictions: user.correct_predictions,
      wrong_predictions: user.wrong_predictions,
      current_streak: user.current_streak,
      best_streak: user.best_streak,
    }));

  return sorted;
}

export async function recalculateUserStats(username: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("recalculate_user_stats", {
    p_discord_username: username.trim().toLowerCase(),
  });
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
}

export async function exportPredictionsCSV(eventId: string): Promise<string> {
  const leaderboard = await getLeaderboard(eventId);
  if (leaderboard.length === 0) return "";

  const headers = ["Rank", "Discord Username", "Points", "Accuracy", "Correct", "Wrong", "Current Streak", "Best Streak"];
  const rows = leaderboard.map((row) => [
    row.rank,
    row.discord_username,
    row.points,
    `${row.accuracy}%`,
    row.correct_predictions,
    row.wrong_predictions,
    row.current_streak,
    row.best_streak,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function resetPredictions(eventId: string): Promise<void> {
  const supabase = createClient();
  const { error: entriesError } = await supabase
    .from("prediction_entries")
    .delete()
    .eq("event_id", eventId);
  if (entriesError) throw new Error(`DB Error: ${entriesError.message} (code: ${entriesError.code})`);

  const { data: remaining } = await supabase
    .from("prediction_entries")
    .select("discord_username")
    .eq("event_id", eventId);
  if (!remaining || remaining.length === 0) return;

  const usernames = [...new Set(remaining.map((e: { discord_username: string }) => e.discord_username))] as string[];
  for (const username of usernames) {
    await recalculateUserStats(username);
  }
}

export async function calculatePredictionResults(
  eventId: string,
  matchId: string,
  winnerId: string
): Promise<void> {
  const supabase = createClient();

  const { data: entries, error: fetchError } = await supabase
    .from("prediction_entries")
    .select("*")
    .eq("event_id", eventId)
    .eq("match_id", matchId);
  if (fetchError) throw fetchError;
  if (!entries || entries.length === 0) return;

  for (const entry of entries) {
    const isCorrect = entry.selected_team_id === winnerId;
    await supabase
      .from("prediction_entries")
      .update({ is_correct: isCorrect })
      .eq("id", entry.id);
  }
}

// ── Prediction Event Matches (junction table) ──────────

export async function getPredictionEventMatches(predictionEventId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prediction_event_matches")
    .select("match_id")
    .eq("prediction_event_id", predictionEventId);
  if (error) throw error;
  return (data || []).map((row: { match_id: string }) => row.match_id);
}

export async function setPredictionEventMatches(
  predictionEventId: string,
  matchIds: string[]
): Promise<void> {
  const supabase = createClient();

  // Delete all existing
  await supabase
    .from("prediction_event_matches")
    .delete()
    .eq("prediction_event_id", predictionEventId);

  if (matchIds.length === 0) return;

  // Insert new
  const rows = matchIds.map((matchId: string) => ({
    prediction_event_id: predictionEventId,
    match_id: matchId,
  }));
  const { error } = await supabase
    .from("prediction_event_matches")
    .insert(rows);
  if (error) throw new Error(`DB Error: ${error.message} (code: ${error.code})`);
}
