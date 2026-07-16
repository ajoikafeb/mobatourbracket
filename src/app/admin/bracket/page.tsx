"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Loader2, Wand2, RefreshCw, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useBrackets } from "@/hooks/use-brackets";
import { useTeams } from "@/hooks/use-teams";
import { useMatches } from "@/hooks/use-matches";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { BracketView } from "@/components/bracket/bracket-view";
import { MatchEditor } from "@/components/admin/match-editor";
import { BracketToolbar } from "@/components/admin/bracket-toolbar";
import { RoundScheduler } from "@/components/admin/round-scheduler";
import {
  generateBracket,
  computeStats,
  advanceWinner,
  resetMatch as engineResetMatch,
  mapTeamFromDB,
  mapMatchFromDB,
  mapMatchToDB,
  type EngineMatch,
  type EngineBracket,
  type EngineTeam,
  type RoundName,
  ROUND_ORDER,
} from "@/engine";

async function syncBracketsAfterSave(
  match: EngineMatch,
  winnerId: string | null,
  supabase: ReturnType<typeof createClient>
): Promise<Error | null> {
  if (!winnerId) return null;

  const currentRoundOrder = match.roundOrder;
  const matchIndex = match.matchIndex;

  const { data: currentSlots, error: fetchError } = await supabase
    .from("brackets")
    .select("id, position, team_id")
    .eq("round_order", currentRoundOrder);

  if (fetchError) {
    console.error("syncBracketsAfterSave: fetch current slots error:", fetchError);
    return fetchError;
  }
  if (!currentSlots) return null;

  const slotA = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2);
  const slotB = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2 + 1);

  if (slotA) {
    const { error } = await supabase
      .from("brackets")
      .update({ is_winner: slotA.team_id === winnerId })
      .eq("id", slotA.id);
    if (error) {
      console.error("syncBracketsAfterSave: update slotA error:", error);
      return error;
    }
  }
  if (slotB) {
    const { error } = await supabase
      .from("brackets")
      .update({ is_winner: slotB.team_id === winnerId })
      .eq("id", slotB.id);
    if (error) {
      console.error("syncBracketsAfterSave: update slotB error:", error);
      return error;
    }
  }

  const nextRoundOrder = currentRoundOrder + 1;
  const nextSlotPosition = Math.floor(matchIndex / 2) * 2 + (matchIndex % 2 === 0 ? 0 : 1);
  const winnerTeam = match.teamA?.id === winnerId ? match.teamA : match.teamB;

  if (winnerTeam) {
    const nextRoundName = ROUND_ORDER[nextRoundOrder];
    if (nextRoundName) {
      const { error } = await supabase.from("brackets").upsert(
        {
          round: nextRoundName,
          round_order: nextRoundOrder,
          position: nextSlotPosition,
          team_name: winnerTeam.name,
          team_seed: winnerTeam.seed,
          team_id: winnerTeam.id,
        },
        { onConflict: "round,position" }
      );
      if (error) {
        console.error("syncBracketsAfterSave: upsert next round slot error:", error);
        return error;
      }
    }
  }

  return null;
}

async function syncBracketsAfterReset(
  match: EngineMatch,
  supabase: ReturnType<typeof createClient>
): Promise<Error | null> {
  const currentRoundOrder = match.roundOrder;
  const matchIndex = match.matchIndex;

  const { data: currentSlots, error: fetchError } = await supabase
    .from("brackets")
    .select("id, position")
    .eq("round_order", currentRoundOrder);

  if (fetchError) {
    console.error("syncBracketsAfterReset: fetch current slots error:", fetchError);
    return fetchError;
  }
  if (!currentSlots) return null;

  const slotA = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2);
  const slotB = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2 + 1);

  if (slotA) {
    const { error } = await supabase.from("brackets").update({ is_winner: false }).eq("id", slotA.id);
    if (error) {
      console.error("syncBracketsAfterReset: update slotA error:", error);
      return error;
    }
  }
  if (slotB) {
    const { error } = await supabase.from("brackets").update({ is_winner: false }).eq("id", slotB.id);
    if (error) {
      console.error("syncBracketsAfterReset: update slotB error:", error);
      return error;
    }
  }

  const nextRoundOrder = currentRoundOrder + 1;
  const nextSlotPosition = Math.floor(matchIndex / 2) * 2 + (matchIndex % 2 === 0 ? 0 : 1);

  const nextRoundName = ROUND_ORDER[nextRoundOrder];
  if (nextRoundName) {
    const { error } = await supabase.from("brackets").upsert(
      {
        round: nextRoundName,
        round_order: nextRoundOrder,
        position: nextSlotPosition,
        team_name: "",
        team_seed: 0,
        team_id: null,
      },
      { onConflict: "round,position" }
    );
    if (error) {
      console.error("syncBracketsAfterReset: upsert next round slot error:", error);
      return error;
    }
  }

  return null;
}

export default function AdminBracketPage() {
  const { brackets: dbBrackets, loading: bracketsLoading, refetch: refetchBrackets } = useBrackets();
  const { teams: dbTeams, loading: teamsLoading } = useTeams();
  const { matches: dbMatches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { settings } = useSettings();

  const [engineBracket, setEngineBracket] = useState<EngineBracket | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<EngineMatch | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const engineBracketRef = useRef<EngineBracket | null>(null);

  const supabase = createClient();
  const loading = bracketsLoading || teamsLoading || matchesLoading;

  const engineTeams = useMemo(() => {
    return dbTeams.map((t) => mapTeamFromDB(t));
  }, [dbTeams]);

  const engineMatches = useMemo(() => {
    return dbMatches.map((m) => mapMatchFromDB(m));
  }, [dbMatches]);

  useEffect(() => {
    if (loading || engineTeams.length === 0) return;
    if (dbBrackets.length === 0) {
      setEngineBracket(null);
      return;
    }

    const bestOf = settings?.best_of || 3;

    const sortedTeams = [...engineTeams].sort((a, b) => a.seed - b.seed);
    const bracket = generateBracket(sortedTeams, "imported", bestOf);

    for (const em of engineMatches) {
      const existing = bracket.matches.find(
        (m) => m.round === em.round && m.matchIndex === em.matchIndex
      );
      if (existing) {
        existing.id = em.id;
        existing.teamA = em.teamA;
        existing.teamB = em.teamB;
        existing.scoreA = em.scoreA;
        existing.scoreB = em.scoreB;
        existing.status = em.status;
        existing.winnerId = em.winnerId;
        existing.loserId = em.loserId;
        existing.scheduledTime = em.scheduledTime;
      }
    }

    for (const m of bracket.matches) {
      if (m.round === "Champion") continue;
      const nextRoundOrder = m.roundOrder + 1;
      const nextMatchIndex = Math.floor(m.matchIndex / 2);
      const nextSlot: "A" | "B" = m.matchIndex % 2 === 0 ? "A" : "B";
      const nextMatch = bracket.matches.find(
        (nm) => nm.roundOrder === nextRoundOrder && nm.matchIndex === nextMatchIndex
      );
      if (nextMatch) {
        m.nextMatchId = nextMatch.id;
        m.nextSlot = nextSlot;
      }
    }

    bracket.stats = computeStats(bracket.matches);

    setEngineBracket(bracket);
    engineBracketRef.current = bracket;
  }, [loading, engineTeams, engineMatches, dbBrackets, settings]);

  const handleMatchClick = useCallback((match: EngineMatch) => {
    setSelectedMatch(match);
  }, []);

  const handleMatchSave = useCallback(
    async (
      matchId: string,
      scoreA: number,
      scoreB: number,
      winnerId: string | null,
      status: EngineMatch["status"]
    ) => {
      const bracket = engineBracketRef.current;
      setSaving(true);
      try {
        const match = bracket?.matches.find((m) => m.id === matchId);
        if (!match) {
          setMessage("Error: Match not found.");
          setTimeout(() => setMessage(""), 3000);
          setSaving(false);
          return;
        }

        if (scoreA > scoreB) winnerId = match.teamA?.id || null;
        else if (scoreB > scoreA) winnerId = match.teamB?.id || null;

        let result: ReturnType<typeof advanceWinner> = null;
        if (winnerId) {
          result = advanceWinner(matchId, winnerId, bracket!.matches);
        } else {
          match.scoreA = scoreA;
          match.scoreB = scoreB;
          match.status = status;
        }

        const matchesToSave = [match];
        if (result?.updatedNextMatch) {
          matchesToSave.push(result.updatedNextMatch);
        }

        for (const m of matchesToSave) {
          const dbRow = mapMatchToDB(m);
          const { error } = await supabase
            .from("matches")
            .update(dbRow)
            .eq("id", m.id);
          if (error) throw error;
        }

        const syncError = await syncBracketsAfterSave(match, winnerId, supabase);
        if (syncError) throw syncError;

        await Promise.all([refetchMatches(), refetchBrackets()]);

        setMessage("Match saved successfully!");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        console.error("Error saving match:", err);
        setMessage("Error saving match.");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setSaving(false);
      }
    },
    [supabase, refetchMatches, refetchBrackets]
  );

  const handleMatchReset = useCallback(
    async (matchId: string) => {
      const bracket = engineBracketRef.current;
      if (!bracket) return;
      setSaving(true);
      try {
        const match = bracket.matches.find((m) => m.id === matchId);
        if (!match) {
          setMessage("Error: Match not found.");
          setTimeout(() => setMessage(""), 3000);
          setSaving(false);
          return;
        }

        engineResetMatch(matchId, bracket.matches);

        const matchesToSave = [match];
        if (match.nextMatchId) {
          const nextMatch = bracket.matches.find(
            (m) => m.id === match.nextMatchId
          );
          if (nextMatch) matchesToSave.push(nextMatch);
        }

        for (const m of matchesToSave) {
          const dbRow = mapMatchToDB(m);
          const { error } = await supabase
            .from("matches")
            .update(dbRow)
            .eq("id", m.id);
          if (error) throw error;
        }

        const syncError = await syncBracketsAfterReset(match, supabase);
        if (syncError) throw syncError;

        await Promise.all([refetchMatches(), refetchBrackets()]);

        setMessage("Match reset successfully!");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        console.error("Error resetting match:", err);
        setMessage("Error resetting match.");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setSaving(false);
      }
    },
    [supabase, refetchMatches, refetchBrackets]
  );

  const handleUndo = useCallback(() => {}, []);
  const handleRedo = useCallback(() => {}, []);

  const handleResetAll = useCallback(async () => {
    const bracket = engineBracketRef.current;
    if (!bracket) return;
    if (!confirm("Reset all match results? This cannot be undone.")) return;

    setSaving(true);
    try {
      for (const m of bracket.matches) {
        const updatedMatch = { ...m };
        updatedMatch.winnerId = null;
        updatedMatch.loserId = null;
        updatedMatch.scoreA = 0;
        updatedMatch.scoreB = 0;
        updatedMatch.status = "waiting" as const;

        if (updatedMatch.roundOrder > 0) {
          updatedMatch.teamA = null;
          updatedMatch.teamB = null;
        }

        const dbRow = mapMatchToDB(updatedMatch);
        const { error } = await supabase.from("matches").update(dbRow).eq("id", m.id);
        if (error) {
          console.error("Error resetting match in DB:", error);
          throw error;
        }
      }

      const { error: clearWinnerError } = await supabase
        .from("brackets")
        .update({ is_winner: false })
        .eq("is_winner", true);
      if (clearWinnerError) {
        console.error("Error clearing winner flags:", clearWinnerError);
        throw clearWinnerError;
      }

      const { error: clearNextRoundError } = await supabase
        .from("brackets")
        .update({ team_name: "", team_seed: 0, team_id: null })
        .gt("round_order", 0);
      if (clearNextRoundError) {
        console.error("Error clearing next round slots:", clearNextRoundError);
        throw clearNextRoundError;
      }

      await Promise.all([refetchMatches(), refetchBrackets()]);

      setMessage("All matches reset!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error resetting bracket:", err);
      setMessage("Error resetting bracket.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  }, [supabase, refetchMatches, refetchBrackets]);

  const handleRegenerate = useCallback(() => {
    window.location.href = "/admin/tournament-generator";
  }, []);

  const handleSyncBracket = useCallback(async () => {
    const bracket = engineBracketRef.current;
    if (!bracket) return;

    setSaving(true);
    try {
      const finishedMatches = bracket.matches.filter(
        (m) => m.status === "finished" && m.winnerId
      );

      if (finishedMatches.length === 0) {
        setMessage("No finished matches to sync.");
        setTimeout(() => setMessage(""), 2000);
        setSaving(false);
        return;
      }

      for (const m of finishedMatches) {
        const syncError = await syncBracketsAfterSave(m, m.winnerId, supabase);
        if (syncError) {
          console.error("Sync error for match", m.id, syncError);
          throw syncError;
        }
      }

      await refetchBrackets();

      setMessage(`Bracket synced! ${finishedMatches.length} match(es) updated.`);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error syncing bracket:", err);
      setMessage("Error syncing bracket.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  }, [supabase, refetchBrackets]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <Swords className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bracket Editor</h1>
            <p className="text-sm text-zinc-400">
              Click any match to edit scores and set winners
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-zinc-700 text-zinc-300 hover:text-white"
            onClick={handleSyncBracket}
            disabled={saving}
          >
            <RefreshCw className={cn("h-4 w-4", saving && "animate-spin")} />
            Sync Bracket
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-zinc-700 text-zinc-300 hover:text-white"
            onClick={() => setShowScheduler(true)}
            disabled={saving}
          >
            <Calendar className="h-4 w-4" />
            Schedule Round
          </Button>
          <Link href="/admin/tournament-generator">
            <Button variant="outline" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white">
              <Wand2 className="h-4 w-4" />
              Generate New
            </Button>
          </Link>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            message.includes("Error")
              ? "border border-red-500/30 bg-red-500/10 text-red-400"
              : "border border-green-500/30 bg-green-500/10 text-green-400"
          )}
        >
          {message}
        </motion.div>
      )}

      {engineBracket && engineBracket.matches.length > 0 ? (
        <>
          <BracketToolbar
            stats={engineBracket.stats}
            canUndo={false}
            canRedo={false}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onResetAll={handleResetAll}
            onRegenerate={handleRegenerate}
          />

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
            <BracketView
              bracket={engineBracket}
              onMatchClick={handleMatchClick}
              hoveredTeamId={hoveredTeamId}
              onTeamHover={setHoveredTeamId}
              isAdmin
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Swords}
          title="No bracket yet"
          description="Generate a tournament bracket to get started."
          action={
            <Link href="/admin/tournament-generator">
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Wand2 className="h-4 w-4" />
                Generate Bracket
              </Button>
            </Link>
          }
        />
      )}

      <AnimatePresence>
        {selectedMatch && (
          <MatchEditor
            key={selectedMatch.id}
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onSave={handleMatchSave}
            onReset={handleMatchReset}
          />
        )}
      </AnimatePresence>

      {saving && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141416]/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
          <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          <span className="text-xs text-zinc-300">Saving...</span>
        </div>
      )}

      {showScheduler && (
        <RoundScheduler
          matches={dbMatches}
          settings={settings}
          onScheduled={() => {
            refetchMatches();
            refetchBrackets();
          }}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}
