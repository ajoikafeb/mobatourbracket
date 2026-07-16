"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Loader2, Wand2, RotateCcw, Flag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useTournament } from "@/hooks/use-tournament";
import { cn } from "@/lib/utils";
import { BracketView } from "@/components/bracket/bracket-view";
import { MatchEditor } from "@/components/admin/match-editor";
import { BracketToolbar } from "@/components/admin/bracket-toolbar";
import type { EngineMatch } from "@/engine/types";

export default function AdminBracketPage() {
  const {
    bracket,
    loading,
    actionLoading,
    message,
    settings,
    matches,
    resetMatch: doResetMatch,
    resetAll: doResetAll,
    setCurrentMatch: doSetCurrentMatch,
    setMessage,
  } = useTournament();

  const [selectedMatch, setSelectedMatch] = useState<EngineMatch | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  const handleMatchClick = useCallback((match: EngineMatch) => {
    setSelectedMatch(match);
  }, []);

  const handleMatchSave = useCallback(
    async (
      matchId: string,
      scoreA: number,
      scoreB: number,
      winnerId: string | null,
      _status: EngineMatch["status"]
    ) => {
      const match = bracket.matches.find((m) => m.id === matchId);
      if (!match) {
        setMessage("Error: Match not found.");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      if (scoreA > scoreB) winnerId = match.teamA?.id || null;
      else if (scoreB > scoreA) winnerId = match.teamB?.id || null;

      const winnerName = winnerId
        ? match.teamA?.id === winnerId
          ? match.teamA?.name || null
          : match.teamB?.name || null
        : null;

      try {
        await (useTournament as unknown as { (): ReturnType<typeof useTournament> }).prototype;
      } catch {
        // handled below
      }

      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { saveMatchResult } = await import("@/engine/tournament-service");
        const err = await saveMatchResult(supabase, matchId, scoreA, scoreB, winnerId, winnerName, matches);
        if (err) throw err;
        setMessage("Match saved!");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        console.error("Error saving match:", err);
        setMessage("Error saving match.");
        setTimeout(() => setMessage(""), 3000);
      }
    },
    [bracket.matches, matches, setMessage]
  );

  const handleMatchReset = useCallback(
    async (matchId: string) => {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        const { resetMatchResult } = await import("@/engine/tournament-service");
        const err = await resetMatchResult(supabase, matchId, matches);
        if (err) throw err;
        setMessage("Match reset!");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        console.error("Error resetting match:", err);
        setMessage("Error resetting match.");
        setTimeout(() => setMessage(""), 3000);
      }
    },
    [matches, setMessage]
  );

  const handleSetCurrentMatch = useCallback(
    async (matchId: string) => {
      await doSetCurrentMatch(matchId);
    },
    [doSetCurrentMatch]
  );

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

      {bracket && bracket.matches.length > 0 ? (
        <>
          <BracketToolbar
            stats={bracket.stats}
            canUndo={false}
            canRedo={false}
            onUndo={() => {}}
            onRedo={() => {}}
            onResetAll={() => {
              if (confirm("Reset all match results? This cannot be undone.")) {
                doResetAll();
              }
            }}
            onRegenerate={() => {
              window.location.href = "/admin/tournament-generator";
            }}
          />

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
            <BracketView
              bracket={bracket}
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

      {actionLoading && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#141416]/95 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
          <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          <span className="text-xs text-zinc-300">Saving...</span>
        </div>
      )}
    </div>
  );
}
