import type { Settings, Match, Team, TournamentState } from "@/lib/types";
import type { EngineBracket, EngineMatch, EngineTeam, EngineRound } from "./types";
import { getRoundName } from "./types";
import { determineBracketSize, computeStats } from "./bracket-engine";
import { mapTeamFromDB } from "./mapping";

export interface RoundProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface TournamentSnapshot {
  tournamentState: TournamentState;
  currentRoundOrder: number;
  currentRoundName: string;
  currentMatch: Match | null;
  roundProgress: RoundProgress;
  isRoundComplete: boolean;
  canProceedToNextRound: boolean;
  canFinishTournament: boolean;
  bracketSize: number;
  totalRounds: number;
  champion: Team | null;
}

// ── Helpers ──────────────────────────────────────────────

function getBracketSizeFromMatches(matches: Match[]): number {
  const round0Count = matches.filter((m) => m.round_order === 0).length;
  if (round0Count === 0) return 2;
  return round0Count * 2;
}

function emptyBracket(): EngineBracket {
  return {
    teams: [],
    rounds: [],
    matches: [],
    champion: null,
    stats: { totalMatches: 0, completedMatches: 0, liveMatches: 0, waitingMatches: 0, progress: 0 },
    config: { bracketSize: 0, totalByes: 0, bestOf: 3, seedingMode: "imported" },
  };
}

function deriveTournamentState(settings: Settings): TournamentState {
  if (settings.tournament_status === "completed") return "completed";
  if (settings.tournament_status === "ongoing") return "running";
  return "draft";
}

function deriveCurrentRoundOrder(matches: Match[]): number {
  if (matches.length === 0) return 0;
  const roundOrders = [...new Set(matches.map((m) => m.round_order))].sort((a, b) => a - b);
  if (roundOrders.length === 0) return 0;

  for (const roundOrder of roundOrders) {
    const roundMatches = matches.filter((m) => m.round_order === roundOrder);
    const allFinished = roundMatches.every((m) => m.status === "finished");
    if (!allFinished) return roundOrder;
  }

  return roundOrders[roundOrders.length - 1];
}

function getLastRoundWithMatches(matches: Match[]): number {
  if (matches.length === 0) return 0;
  const roundOrders = [...new Set(matches.map((m) => m.round_order))].sort((a, b) => a - b);
  return roundOrders[roundOrders.length - 1] ?? 0;
}

// ── Pure Read Operations ──────────────────────────────────

export function getBracketSize(teamCount: number): number {
  return determineBracketSize(teamCount);
}

export function getTotalRounds(bracketSize: number): number {
  return Math.log2(bracketSize);
}

export function getCurrentRoundName(settings: Settings, matches: Match[]): string {
  if (matches.length === 0) return "N/A";
  const bracketSize = getBracketSizeFromMatches(matches);
  const currentRound = deriveCurrentRoundOrder(matches);
  return getRoundName(bracketSize, currentRound);
}

export function getRoundMatches(matches: Match[], roundOrder: number): Match[] {
  return matches
    .filter((m) => m.round_order === roundOrder)
    .sort((a, b) => a.match_index - b.match_index);
}

export function getRoundProgress(settings: Settings, matches: Match[]): RoundProgress {
  const currentRound = deriveCurrentRoundOrder(matches);
  const roundMatches = getRoundMatches(matches, currentRound);
  const total = roundMatches.length;
  const completed = roundMatches.filter((m) => m.status === "finished").length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function isRoundNComplete(matches: Match[], roundOrder: number): boolean {
  const roundMatches = getRoundMatches(matches, roundOrder);
  return roundMatches.length > 0 && roundMatches.every((m) => m.status === "finished");
}

export function isRoundComplete(settings: Settings, matches: Match[]): boolean {
  const currentRound = deriveCurrentRoundOrder(matches);
  return isRoundNComplete(matches, currentRound);
}

export function canProceedToNextRound(settings: Settings, matches: Match[]): boolean {
  const state = deriveTournamentState(settings);
  if (state !== "running") return false;
  const bracketSize = getBracketSizeFromMatches(matches);
  const totalRounds = getTotalRounds(bracketSize);
  const lastRound = getLastRoundWithMatches(matches);

  if (lastRound >= totalRounds - 1) return false;

  return isRoundNComplete(matches, lastRound);
}

export function canFinishTournament(settings: Settings, matches: Match[]): boolean {
  const state = deriveTournamentState(settings);
  if (state !== "running") return false;
  const lastRound = getLastRoundWithMatches(matches);
  return isRoundNComplete(matches, lastRound) && !canProceedToNextRound(settings, matches);
}

export function getCurrentMatchFromSettings(settings: Settings, matches: Match[]): Match | null {
  if (!settings.current_match_id) return null;
  return matches.find((m) => m.id === settings.current_match_id) || null;
}

export function findChampion(matches: Match[], teams: Team[]): Team | null {
  const grandFinal = matches.find(
    (m) => m.round === "Grand Final" && m.status === "finished" && m.winner_id
  );
  if (!grandFinal?.winner_id) return null;
  return teams.find((t) => t.id === grandFinal.winner_id) || null;
}

export function findPlacements(matches: Match[], teams: Team[], topN: number): { rank: number; team: Team | null }[] {
  const results: { rank: number; team: Team | null }[] = [];
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const gf = matches.find((m) => m.round === "Grand Final" && m.status === "finished");
  if (gf?.winner_id) {
    results.push({ rank: 1, team: teamMap.get(gf.winner_id) || null });
  } else {
    results.push({ rank: 1, team: null });
  }
  if (topN <= 1) return results;

  if (gf) {
    const loserId = gf.winner_id === gf.team_a_id ? gf.team_b_id : gf.team_a_id;
    results.push({ rank: 2, team: loserId ? teamMap.get(loserId) || null : null });
  } else {
    results.push({ rank: 2, team: null });
  }
  if (topN <= 2) return results;

  const sfMatches = matches.filter((m) => m.round === "Semi Final" && m.status === "finished");
  const sfLosers = sfMatches.map((m) => {
    const loserId = m.winner_id === m.team_a_id ? m.team_b_id : m.team_a_id;
    return loserId ? teamMap.get(loserId) || null : null;
  });
  for (let i = 0; i < Math.min(sfLosers.length, topN - 2); i++) {
    results.push({ rank: 3 + i, team: sfLosers[i] });
  }
  if (topN <= 4) return results;

  const qfMatches = matches.filter((m) => m.round === "Quarter Final" && m.status === "finished");
  const qfLosers = qfMatches.map((m) => {
    const loserId = m.winner_id === m.team_a_id ? m.team_b_id : m.team_a_id;
    return loserId ? teamMap.get(loserId) || null : null;
  });
  for (let i = 0; i < Math.min(qfLosers.length, topN - 4); i++) {
    results.push({ rank: 5 + i, team: qfLosers[i] });
  }

  return results;
}

export function buildTournamentSnapshot(
  settings: Settings,
  matches: Match[],
  teams: Team[]
): TournamentSnapshot {
  const bracketSize = getBracketSizeFromMatches(matches);
  const totalRounds = getTotalRounds(bracketSize);
  const tournamentState = deriveTournamentState(settings);
  const currentRoundOrder = deriveCurrentRoundOrder(matches);
  const roundProgress = getRoundProgress(settings, matches);
  const isRoundComplete_ = isRoundComplete(settings, matches);
  const canProceed = canProceedToNextRound(settings, matches);
  const canFinish = canFinishTournament(settings, matches);
  const currentMatch = getCurrentMatchFromSettings(settings, matches);
  const champion = findChampion(matches, teams);

  return {
    tournamentState,
    currentRoundOrder,
    currentRoundName: getCurrentRoundName(settings, matches),
    currentMatch,
    roundProgress,
    isRoundComplete: isRoundComplete_,
    canProceedToNextRound: canProceed,
    canFinishTournament: canFinish,
    bracketSize,
    totalRounds,
    champion,
  };
}

// ── Bracket Reconstruction from DB ────────────────────────

export function reconstructBracketFromDB(
  matches: Match[],
  teams: Team[],
  bestOf: number
): EngineBracket {
  if (matches.length === 0) return emptyBracket();

  const bracketSize = getBracketSizeFromMatches(matches);
  const totalRounds = getTotalRounds(bracketSize);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const rounds: EngineRound[] = [];
  const allMatches: EngineMatch[] = [];

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const name = getRoundName(bracketSize, roundIdx);
    rounds.push({ name, order: roundIdx, matches: [] });
  }
  rounds.push({ name: "Champion", order: totalRounds, matches: [] });

  const round0Matches = matches.filter((m) => m.round_order === 0);
  let matchNumber = 1;

  for (let roundIdx = 0; roundIdx <= totalRounds; roundIdx++) {
    const roundMatches = matches
      .filter((m) => m.round_order === roundIdx)
      .sort((a, b) => a.match_index - b.match_index);

    for (const dbMatch of roundMatches) {
      const teamA = dbMatch.team_a_id ? teamMap.get(dbMatch.team_a_id) || null : null;
      const teamB = dbMatch.team_b_id ? teamMap.get(dbMatch.team_b_id) || null : null;

      const engineTeamA = teamA ? mapTeamFromDB(teamA, dbMatch.winner_id != null && dbMatch.winner_id !== dbMatch.team_a_id) : null;
      const engineTeamB = teamB ? mapTeamFromDB(teamB, dbMatch.winner_id != null && dbMatch.winner_id !== dbMatch.team_b_id) : null;

      const nextRoundOrder = roundIdx + 1;
      const nextMatchIndex = Math.floor(dbMatch.match_index / 2);
      const nextSlot: "A" | "B" = dbMatch.match_index % 2 === 0 ? "A" : "B";

      const nextMatch = nextRoundOrder < totalRounds
        ? matches.find(
            (m) => m.round_order === nextRoundOrder && m.match_index === nextMatchIndex
          )
        : null;

      const engineMatch: EngineMatch = {
        id: dbMatch.id,
        round: dbMatch.round as EngineMatch["round"],
        roundOrder: roundIdx,
        matchIndex: dbMatch.match_index,
        matchNumber: matchNumber++,
        teamA: engineTeamA,
        teamB: engineTeamB,
        scoreA: dbMatch.score_a,
        scoreB: dbMatch.score_b,
        status: dbMatch.status as EngineMatch["status"],
        winnerId: dbMatch.winner_id,
        loserId: null,
        scheduledTime: dbMatch.match_date,
        bestOf: dbMatch.best_of || bestOf,
        nextMatchId: nextMatch?.id || null,
        nextSlot: nextRoundOrder < totalRounds ? nextSlot : null,
      };

      if (rounds[roundIdx]) {
        rounds[roundIdx].matches.push(engineMatch);
      }
      allMatches.push(engineMatch);
    }
  }

  const champion = findChampion(matches, Array.from(teamMap.values()));
  const stats = computeStats(allMatches);

  return {
    teams: teams.map((t) => mapTeamFromDB(t)),
    rounds,
    matches: allMatches,
    champion: champion ? mapTeamFromDB(champion) : null,
    stats,
    config: {
      bracketSize,
      totalByes: bracketSize - round0Matches.length * 2,
      bestOf,
      seedingMode: "imported",
    },
  };
}

// ── Write Operations ──────────────────────────────────────

type SupabaseClient = {
  from: (table: string) => {
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: unknown) => Promise<{ error: unknown }>;
    };
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      select: () => Promise<{ error: unknown }>;
    };
    select: () => {
      eq: (col: string, val: unknown) => {
        single: () => Promise<{ data: Match | null; error: unknown }>;
      };
    };
  };
};

export async function startTournament(
  supabase: SupabaseClient,
  settingsId: string
): Promise<Error | null> {
  const { error } = await supabase
    .from("settings")
    .update({
      tournament_status: "ongoing",
    })
    .eq("id", settingsId);
  return error ? new Error(String(error)) : null;
}

export async function finishTournament(
  supabase: SupabaseClient,
  settingsId: string
): Promise<Error | null> {
  const { error } = await supabase
    .from("settings")
    .update({
      tournament_status: "completed",
    })
    .eq("id", settingsId);
  return error ? new Error(String(error)) : null;
}

export async function setCurrentMatchId(
  _supabase: SupabaseClient,
  _settingsId: string,
  _matchId: string | null
): Promise<Error | null> {
  return null;
}

export async function createNextRoundMatches(
  supabase: SupabaseClient,
  settings: Settings,
  matches: Match[]
): Promise<Error | null> {
  const bracketSize = getBracketSizeFromMatches(matches);
  const totalRounds = getTotalRounds(bracketSize);
  const lastRound = getLastRoundWithMatches(matches);
  const nextRound = lastRound + 1;

  if (nextRound >= totalRounds) {
    return new Error("No next round available");
  }

  const lastRoundMatches = matches
    .filter((m) => m.round_order === lastRound && m.status === "finished")
    .sort((a, b) => a.match_index - b.match_index);

  if (lastRoundMatches.length === 0) {
    return new Error("No finished matches in current round");
  }

  const nextRoundName = getRoundName(bracketSize, nextRound);
  const nextMatchCount = Math.ceil(lastRoundMatches.length / 2);
  const newMatches: Record<string, unknown>[] = [];

  for (let i = 0; i < nextMatchCount; i++) {
    const teamAMatch = lastRoundMatches[i * 2];
    const teamBMatch = lastRoundMatches[i * 2 + 1];

    newMatches.push({
      team_a: teamAMatch?.winner || "",
      team_a_id: teamAMatch?.winner_id || null,
      team_b: teamBMatch?.winner || "",
      team_b_id: teamBMatch?.winner_id || null,
      score_a: 0,
      score_b: 0,
      status: "waiting",
      round: nextRoundName,
      round_order: nextRound,
      match_index: i,
      match_date: new Date().toISOString(),
      best_of: settings.best_of,
      winner: null,
      winner_id: null,
      bracket_slot: null,
    });
  }

  const { error } = await supabase
    .from("matches")
    .insert(newMatches)
    .select();

  if (error) return new Error(String(error));
  return null;
}

export async function saveMatchResult(
  supabase: SupabaseClient,
  matchId: string,
  scoreA: number,
  scoreB: number,
  winnerId: string | null,
  winnerName: string | null,
  matches: Match[]
): Promise<Error | null> {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return new Error("Match not found");

  const { error: updateErr } = await supabase
    .from("matches")
    .update({
      score_a: scoreA,
      score_b: scoreB,
      winner_id: winnerId,
      winner: winnerName,
      status: "finished",
    })
    .eq("id", matchId);
  if (updateErr) return new Error(String(updateErr));

  if (winnerId) {
    const nextRoundOrder = match.round_order + 1;
    const nextMatchIndex = Math.floor(match.match_index / 2);
    const slot = match.match_index % 2 === 0 ? "team_a_id" : "team_b_id";
    const slotName = match.match_index % 2 === 0 ? "team_a" : "team_b";

    const nextMatch = matches.find(
      (m) => m.round_order === nextRoundOrder && m.match_index === nextMatchIndex
    );

    if (nextMatch) {
      const { error: advErr } = await supabase
        .from("matches")
        .update({
          [slot]: winnerId,
          [slotName]: winnerName || "",
        })
        .eq("id", nextMatch.id);
      if (advErr) return new Error(String(advErr));
    }
  }

  return null;
}

export async function resetMatchResult(
  supabase: SupabaseClient,
  matchId: string,
  matches: Match[]
): Promise<Error | null> {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return new Error("Match not found");

  const { error: resetErr } = await supabase
    .from("matches")
    .update({
      score_a: 0,
      score_b: 0,
      winner_id: null,
      winner: null,
      status: "waiting",
    })
    .eq("id", matchId);
  if (resetErr) return new Error(String(resetErr));

  if (match.winner_id) {
    const nextRoundOrder = match.round_order + 1;
    const nextMatchIndex = Math.floor(match.match_index / 2);
    const slot = match.match_index % 2 === 0 ? "team_a_id" : "team_b_id";
    const slotName = match.match_index % 2 === 0 ? "team_a" : "team_b";

    const nextMatch = matches.find(
      (m) => m.round_order === nextRoundOrder && m.match_index === nextMatchIndex
    );

    if (nextMatch && nextMatch[slot as keyof Match] === match.winner_id) {
      const { error: clearErr } = await supabase
        .from("matches")
        .update({
          [slot]: null,
          [slotName]: "",
        })
        .eq("id", nextMatch.id);
      if (clearErr) return new Error(String(clearErr));
    }
  }

  return null;
}

export async function resetAllMatches(
  supabase: SupabaseClient,
  settingsId: string,
  matches: Match[]
): Promise<Error | null> {
  for (const match of matches) {
    const update: Record<string, unknown> = {
      score_a: 0,
      score_b: 0,
      winner_id: null,
      winner: null,
      status: "waiting",
    };

    if (match.round_order > 0) {
      update.team_a_id = null;
      update.team_a = "";
      update.team_b_id = null;
      update.team_b = "";
    }

    const { error } = await supabase
      .from("matches")
      .update(update)
      .eq("id", match.id);
    if (error) return new Error(String(error));
  }

  const { error: settingsErr } = await supabase
    .from("settings")
    .update({
      tournament_status: "upcoming",
    })
    .eq("id", settingsId);
  if (settingsErr) return new Error(String(settingsErr));

  return null;
}
