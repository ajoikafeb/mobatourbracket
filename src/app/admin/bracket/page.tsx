"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Loader2, Wand2 } from "lucide-react";
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
} from "@/engine";

async function syncBracketsAfterSave(
  match: EngineMatch,
  winnerId: string | null,
  supabase: ReturnType<typeof createClient>
) {
  if (!winnerId) return;

  const currentRoundOrder = match.roundOrder;
  const matchIndex = match.matchIndex;

  const { data: currentSlots } = await supabase
    .from("brackets")
    .select("id, position, team_id")
    .eq("round_order", currentRoundOrder);

  if (!currentSlots) return;

  const slotA = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2);
  const slotB = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2 + 1);

  if (slotA) {
    await supabase
      .from("brackets")
      .update({ is_winner: slotA.team_id === winnerId })
      .eq("id", slotA.id);
  }
  if (slotB) {
    await supabase
      .from("brackets")
      .update({ is_winner: slotB.team_id === winnerId })
      .eq("id", slotB.id);
  }

  const nextRoundOrder = currentRoundOrder + 1;
  const nextSlotPosition = Math.floor(matchIndex / 2) * 2 + (matchIndex % 2 === 0 ? 0 : 1);
  const winnerTeam = match.teamA?.id === winnerId ? match.teamA : match.teamB;

  if (winnerTeam) {
    await supabase
      .from("brackets")
      .update({
        team_name: winnerTeam.name,
        team_seed: winnerTeam.seed,
        team_id: winnerTeam.id,
      })
      .eq("round_order", nextRoundOrder)
      .eq("position", nextSlotPosition);
  }
}

async function syncBracketsAfterReset(
  match: EngineMatch,
  supabase: ReturnType<typeof createClient>
) {
  const currentRoundOrder = match.roundOrder;
  const matchIndex = match.matchIndex;

  const { data: currentSlots } = await supabase
    .from("brackets")
    .select("id, position")
    .eq("round_order", currentRoundOrder);

  if (!currentSlots) return;

  const slotA = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2);
  const slotB = currentSlots.find((b: { position: number }) => b.position === matchIndex * 2 + 1);

  if (slotA) {
    await supabase.from("brackets").update({ is_winner: false }).eq("id", slotA.id);
  }
  if (slotB) {
    await supabase.from("brackets").update({ is_winner: false }).eq("id", slotB.id);
  }

  const nextRoundOrder = currentRoundOrder + 1;
  const nextSlotPosition = Math.floor(matchIndex / 2) * 2 + (matchIndex % 2 === 0 ? 0 : 1);

  await supabase
    .from("brackets")
    .update({ team_name: "", team_seed: 0, team_id: null })
    .eq("round_order", nextRoundOrder)
    .eq("position", nextSlotPosition);
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
      setSaving(true);
      try {
        const match = engineBracket?.matches.find((m) => m.id === matchId);
        if (!match) return;

        if (scoreA > scoreB) winnerId = match.teamA?.id || null;
        else if (scoreB > scoreA) winnerId = match.teamB?.id || null;

        if (winnerId) {
          advanceWinner(matchId, winnerId, engineBracket!.matches);
        } else {
          match.scoreA = scoreA;
          match.scoreB = scoreB;
          match.status = status;
        }

        for (const m of engineBracket!.matches) {
          const dbRow = mapMatchToDB(m);
          const { error } = await supabase
            .from("matches")
            .update(dbRow)
            .eq("id", m.id);
          if (error) throw error;
        }

        await syncBracketsAfterSave(match, winnerId, supabase);

        await Promise.all([refetchMatches(), refetchBrackets()]);

        setMessage("Match saved successfully!");
        setTimeout(() => setMessage(""), 2000);
      } catch {
        setMessage("Error saving match.");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setSaving(false);
      }
    },
    [engineBracket, supabase, refetchMatches, refetchBrackets]
  );

  const handleMatchReset = useCallback(
    async (matchId: string) => {
      if (!engineBracket) return;
      setSaving(true);
      try {
        engineResetMatch(matchId, engineBracket.matches);

        for (const m of engineBracket.matches) {
          if (m.roundOrder === 0) continue;
          const dbRow = mapMatchToDB(m);
          await supabase.from("matches").update(dbRow).eq("id", m.id);
        }

        await syncBracketsAfterReset(
          engineBracket.matches.find((m) => m.id === matchId)!,
          supabase
        );

        await Promise.all([refetchMatches(), refetchBrackets()]);

        setMessage("Match reset successfully!");
        setTimeout(() => setMessage(""), 2000);
      } catch {
        setMessage("Error resetting match.");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setSaving(false);
      }
    },
    [engineBracket, supabase, refetchMatches, refetchBrackets]
  );

  const handleUndo = useCallback(() => {}, []);
  const handleRedo = useCallback(() => {}, []);

  const handleResetAll = useCallback(async () => {
    if (!engineBracket) return;
    if (!confirm("Reset all match results? This cannot be undone.")) return;

    setSaving(true);
    try {
      for (const m of engineBracket.matches) {
        m.winnerId = null;
        m.loserId = null;
        m.scoreA = 0;
        m.scoreB = 0;
        m.status = m.roundOrder === 0 ? "waiting" : "waiting";

        if (m.roundOrder > 0) {
          m.teamA = null;
          m.teamB = null;
        }

        const dbRow = mapMatchToDB(m);
        await supabase.from("matches").update(dbRow).eq("id", m.id);
      }

      await supabase
        .from("brackets")
        .update({ is_winner: false })
        .eq("is_winner", true);

      await supabase
        .from("brackets")
        .update({ team_name: "", team_seed: 0, team_id: null })
        .gt("round_order", 0);

      await Promise.all([refetchMatches(), refetchBrackets()]);

      setMessage("All matches reset!");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Error resetting bracket.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  }, [engineBracket, supabase, refetchMatches, refetchBrackets]);

  const handleRegenerate = useCallback(() => {
    window.location.href = "/admin/tournament-generator";
  }, []);

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
    </div>
  );
}
