"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Settings, Match, Team } from "@/lib/types";
import type { EngineBracket } from "@/engine/types";
import {
  buildTournamentSnapshot,
  reconstructBracketFromDB,
  saveMatchResult,
  resetMatchResult,
  resetAllMatches,
  deleteTournamentHistory,
  startTournament,
  finishTournament,
  setCurrentMatchId,
  createNextRoundMatches,
  type TournamentSnapshot,
  type RoundProgress,
} from "@/engine/tournament-service";

export function useTournament() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchAll() {
      try {
        const [settingsRes, matchesRes, teamsRes] = await Promise.all([
          supabase
            .from("settings")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("matches")
            .select("*")
            .order("match_date", { ascending: true }),
          supabase
            .from("teams")
            .select("*")
            .order("team_name", { ascending: true }),
        ]);

        if (!cancelled) {
          setSettings(settingsRes.error ? null : settingsRes.data);
          setMatches(matchesRes.error ? [] : matchesRes.data || []);
          setTeams(teamsRes.error ? [] : teamsRes.data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSettings(null);
          setMatches([]);
          setTeams([]);
          setLoading(false);
        }
      }
    }

    fetchAll();

    try {
      const channel = supabase
        .channel("tournament-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "settings" },
          () => fetchAll()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => fetchAll()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "teams" },
          () => fetchAll()
        )
        .subscribe();

      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        cancelled = true;
      };
    }
  }, []);

  // ── Derived State ──────────────────────────────────────

  const snapshot = useMemo<TournamentSnapshot | null>(() => {
    if (!settings) return null;
    return buildTournamentSnapshot(settings, matches, teams);
  }, [settings, matches, teams]);

  const bracket = useMemo<EngineBracket>(() => {
    if (matches.length === 0 || teams.length === 0) {
      return {
        teams: [],
        rounds: [],
        matches: [],
        champion: null,
        stats: { totalMatches: 0, completedMatches: 0, liveMatches: 0, waitingMatches: 0, progress: 0 },
        config: { bracketSize: 0, totalByes: 0, bestOf: 3, seedingMode: "imported" },
      };
    }
    return reconstructBracketFromDB(matches, teams, settings?.best_of || 3);
  }, [matches, teams, settings?.best_of]);

  // ── Actions ────────────────────────────────────────────

  const showMsg = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }, []);

  const doStartTournament = useCallback(async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const err = await startTournament(supabaseRef.current, settings.id);
      if (err) throw err;
      showMsg("Tournament started!");
    } catch (err) {
      console.error("Error starting tournament:", err);
      showMsg("Error starting tournament. Make sure you have matches generated.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, showMsg]);

  const doProceedToNextRound = useCallback(async () => {
    if (!settings || !snapshot?.canProceedToNextRound) return;
    setActionLoading(true);
    try {
      const err = await createNextRoundMatches(supabaseRef.current, settings, matches);
      if (err) throw err;
      showMsg(`${snapshot.currentRoundName} matches created!`);
    } catch (err) {
      console.error("Error creating next round:", err);
      showMsg("Error creating next round.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, snapshot, matches, showMsg]);

  const doFinishTournament = useCallback(async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const err = await finishTournament(supabaseRef.current, settings.id);
      if (err) throw err;
      showMsg("Tournament completed!");
    } catch (err) {
      console.error("Error finishing tournament:", err);
      showMsg("Error finishing tournament.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, showMsg]);

  const doSetCurrentMatch = useCallback(async (matchId: string | null) => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const err = await setCurrentMatchId(supabaseRef.current, settings.id, matchId);
      if (err) throw err;
      showMsg("Current match updated!");
    } catch (err) {
      console.error("Error setting current match:", err);
      showMsg("Error setting current match.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, showMsg]);

  const doSaveMatch = useCallback(async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string | null,
    winnerName: string | null
  ) => {
    setActionLoading(true);
    try {
      const err = await saveMatchResult(supabaseRef.current, matchId, scoreA, scoreB, winnerId, winnerName, matches);
      if (err) throw err;
      showMsg("Match saved!");
    } catch (err) {
      console.error("Error saving match:", err);
      showMsg("Error saving match.");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [matches, showMsg]);

  const doResetMatch = useCallback(async (matchId: string) => {
    setActionLoading(true);
    try {
      const err = await resetMatchResult(supabaseRef.current, matchId, matches);
      if (err) throw err;
      showMsg("Match reset!");
    } catch (err) {
      console.error("Error resetting match:", err);
      showMsg("Error resetting match.");
    } finally {
      setActionLoading(false);
    }
  }, [matches, showMsg]);

  const doResetAll = useCallback(async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const err = await resetAllMatches(supabaseRef.current, settings.id, matches);
      if (err) throw err;
      showMsg("All matches reset!");
    } catch (err) {
      console.error("Error resetting all:", err);
      showMsg("Error resetting all.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, matches, showMsg]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [settingsRes, matchesRes, teamsRes] = await Promise.all([
      supabase
        .from("settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true }),
      supabase
        .from("teams")
        .select("*")
        .order("team_name", { ascending: true }),
    ]);
    setSettings(settingsRes.error ? null : settingsRes.data);
    setMatches(matchesRes.error ? [] : matchesRes.data || []);
    setTeams(teamsRes.error ? [] : teamsRes.data || []);
  }, []);

  const doDeleteHistory = useCallback(async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const err = await deleteTournamentHistory(supabaseRef.current, settings.id);
      if (err) throw err;
      showMsg("Tournament history deleted!");
    } catch (err) {
      console.error("Error deleting history:", err);
      showMsg("Error deleting history.");
    } finally {
      setActionLoading(false);
    }
  }, [settings, showMsg]);

  return {
    settings,
    matches,
    teams,
    loading,
    actionLoading,
    message,

    // Derived from snapshot
    tournamentState: snapshot?.tournamentState ?? "draft",
    currentRoundOrder: snapshot?.currentRoundOrder ?? 0,
    currentRoundName: snapshot?.currentRoundName ?? "N/A",
    currentMatch: snapshot?.currentMatch ?? null,
    roundProgress: snapshot?.roundProgress ?? { completed: 0, total: 0, percentage: 0 },
    isRoundComplete: snapshot?.isRoundComplete ?? false,
    canProceedToNextRound: snapshot?.canProceedToNextRound ?? false,
    canFinishTournament: snapshot?.canFinishTournament ?? false,
    bracketSize: snapshot?.bracketSize ?? 0,
    totalRounds: snapshot?.totalRounds ?? 0,
    champion: snapshot?.champion ?? null,

    // Engine bracket for BracketView
    bracket,

    // Actions
    startTournament: doStartTournament,
    proceedToNextRound: doProceedToNextRound,
    finishTournament: doFinishTournament,
    setCurrentMatch: doSetCurrentMatch,
    saveMatch: doSaveMatch,
    resetMatch: doResetMatch,
    resetAll: doResetAll,
    deleteHistory: doDeleteHistory,
    refetch,
    setMessage,
  };
}
