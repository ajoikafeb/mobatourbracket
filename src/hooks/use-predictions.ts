"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Team } from "@/lib/types";
import type { PredictionSettings, PredictionEntry, LeaderboardEntry, PredictableMatch, PredictionStatus } from "@/lib/prediction-types";
import {
  getPredictionSettings,
  getPredictionEntries,
  getLeaderboard,
} from "@/services/prediction-service";

export function usePredictionSettings(eventId: string | null) {
  const [settings, setSettings] = useState<PredictionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;
    getPredictionSettings(eventId)
      .then((s) => { if (!cancelled) setSettings(s); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  return { settings, loading };
}

export function usePredictionEntries(eventId: string | null, username?: string) {
  const [entries, setEntries] = useState<PredictionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    try {
      const data = await getPredictionEntries(eventId, username);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, username]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const supabase = createClient();
    try {
      const channel = supabase
        .channel(`prediction-entries-${eventId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "prediction_entries" },
          () => { if (!cancelled) fetchData(); }
        )
        .subscribe();
      return () => { cancelled = true; supabase.removeChannel(channel); };
    } catch {
      return () => { cancelled = true; };
    }
  }, [eventId, fetchData]);

  return { entries, loading, refetch: fetchData };
}

export function useLeaderboard(eventId: string | null) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!eventId) { setLoading(false); return; }
    try {
      const data = await getLeaderboard(eventId);
      setLeaderboard(data);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const supabase = createClient();
    try {
      const channel = supabase
        .channel(`prediction-leaderboard-${eventId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "prediction_entries" },
          () => { if (!cancelled) fetchData(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "prediction_users" },
          () => { if (!cancelled) fetchData(); }
        )
        .subscribe();
      return () => { cancelled = true; supabase.removeChannel(channel); };
    } catch {
      return () => { cancelled = true; };
    }
  }, [eventId, fetchData]);

  return { leaderboard, loading, refetch: fetchData };
}

export function useTopPredictor() {
  const [topPredictors, setTopPredictors] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchData() {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("tournament_status")
          .single();
        if (!settings || settings.tournament_status === "upcoming") {
          if (!cancelled) setTopPredictors([]);
          return;
        }

        const { data: predictionEntries } = await supabase
          .from("prediction_entries")
          .select("event_id");
        if (!predictionEntries || predictionEntries.length === 0) {
          if (!cancelled) setTopPredictors([]);
          return;
        }

        const eventIds = [...new Set(predictionEntries.map((pe: { event_id: string }) => pe.event_id))];
        const allLeaders: LeaderboardEntry[] = [];

        for (const eid of eventIds.slice(0, 5) as string[]) {
          const leaders = await getLeaderboard(eid);
          allLeaders.push(...leaders);
        }

        const merged = new Map<string, LeaderboardEntry>();
        for (const entry of allLeaders) {
          const existing = merged.get(entry.discord_username);
          if (existing) {
            const totalCorrect = existing.correct_predictions + entry.correct_predictions;
            const totalWrong = existing.wrong_predictions + entry.wrong_predictions;
            const totalAll = totalCorrect + totalWrong;
            merged.set(entry.discord_username, {
              ...existing,
              points: existing.points + entry.points,
              correct_predictions: totalCorrect,
              wrong_predictions: totalWrong,
              accuracy: totalAll > 0 ? (totalCorrect / totalAll) * 100 : 0,
              best_streak: Math.max(existing.best_streak, entry.best_streak),
            });
          } else {
            merged.set(entry.discord_username, { ...entry });
          }
        }

        const sorted = [...merged.values()]
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            return b.correct_predictions - a.correct_predictions;
          })
          .slice(0, 3)
          .map((entry: LeaderboardEntry, i: number) => ({ ...entry, rank: i + 1 }));

        if (!cancelled) setTopPredictors(sorted);
      } catch {
        if (!cancelled) setTopPredictors([]);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { topPredictors, loading };
}

export function usePredictableMatches(eventId: string | null) {
  const [matches, setMatches] = useState<PredictableMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!eventId) { console.log("[Prediction] no eventId, skipping"); setLoading(false); return; }
    try {
      console.log("[Prediction] fetching for eventId:", eventId);
      const supabase = createClient();

      const [matchesResult, teamsResult, settingsResult, entriesResult] = await Promise.all([
        supabase.from("matches").select("*").order("match_date", { ascending: true }),
        supabase.from("teams").select("*").order("team_name", { ascending: true }),
        getPredictionSettings(eventId).catch(() => null),
        getPredictionEntries(eventId).catch(() => []),
      ]);

      console.log("[Prediction] matchesResult:", matchesResult.error ? `ERROR: ${matchesResult.error.message}` : `${matchesResult.data?.length ?? 0} matches`, matchesResult.data);
      console.log("[Prediction] teamsResult:", teamsResult.error ? `ERROR: ${teamsResult.error.message}` : `${teamsResult.data?.length ?? 0} teams`);
      console.log("[Prediction] settingsResult:", settingsResult);
      console.log("[Prediction] entriesResult:", entriesResult?.length ?? 0, "entries");

      const allMatches: Match[] = matchesResult.data || [];
      const allTeams: Team[] = teamsResult.data || [];
      const teamMap = new Map(allTeams.map((t) => [t.id, t]));
      const entries = entriesResult || [];
      const lockMinutes = settingsResult?.lock_minutes_before ?? 5;

      const predictable: PredictableMatch[] = allMatches.map((match) => {
        const status: PredictionStatus = (() => {
          if (match.status === "finished") return "calculated";
          if (match.status === "live") return "locked";
          if (match.match_date) {
            const matchTime = new Date(match.match_date).getTime();
            if (matchTime > Date.now()) {
              const lockTime = matchTime - lockMinutes * 60 * 1000;
              if (Date.now() > lockTime) return "locked";
            }
          }
          return "open";
        })();

        const userPrediction = entries.find((pe) => pe.match_id === match.id) || null;

        return {
          match,
          teamA: match.team_a_id ? teamMap.get(match.team_a_id) || null : null,
          teamB: match.team_b_id ? teamMap.get(match.team_b_id) || null : null,
          predictionStatus: status,
          userPrediction,
        };
      });

      if (!cancelledRef.current) setMatches(predictable);
    } catch {
      if (!cancelledRef.current) setMatches([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!eventId) return;
    cancelledRef.current = false;
    const supabase = createClient();
    try {
      const channel = supabase
        .channel(`prediction-matches-${eventId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => { if (!cancelledRef.current) fetchData(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "prediction_entries" },
          () => { if (!cancelledRef.current) fetchData(); }
        )
        .subscribe();
      return () => { cancelledRef.current = true; supabase.removeChannel(channel); };
    } catch {
      return () => { cancelledRef.current = true; };
    }
  }, [eventId, fetchData]);

  return { matches, loading, refetch: fetchData };
}
