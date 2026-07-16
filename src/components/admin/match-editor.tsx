"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Minus, Plus, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EngineMatch } from "@/engine/types";

interface MatchEditorProps {
  match: EngineMatch;
  onClose: () => void;
  onSave: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string | null,
    status: EngineMatch["status"]
  ) => void;
  onReset: (matchId: string) => void;
}

export function MatchEditor({ match, onClose, onSave, onReset }: MatchEditorProps) {
  const [scoreA, setScoreA] = useState(match.scoreA);
  const [scoreB, setScoreB] = useState(match.scoreB);
  const [status, setStatus] = useState<EngineMatch["status"]>(match.status);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(match.winnerId);

  const teamA = match.teamA;
  const teamB = match.teamB;
  const hasTeams = teamA && teamB;

  function handleSave() {
    let winnerId = selectedWinner;
    if (scoreA > scoreB) winnerId = teamA?.id || null;
    else if (scoreB > scoreA) winnerId = teamB?.id || null;

    onSave(match.id, scoreA, scoreB, winnerId, "finished");
    onClose();
  }

  function handleReset() {
    onReset(match.id);
    setScoreA(0);
    setScoreB(0);
    setStatus("waiting");
    setSelectedWinner(null);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#141416] p-6 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>

          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400 mb-2">
              {match.round}
            </span>
            <h3 className="text-lg font-bold text-white">Match Editor</h3>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 text-center">
              <p className={cn(
                "text-sm font-semibold mb-1",
                selectedWinner === teamA?.id ? "text-orange-400" : "text-white"
              )}>
                {teamA?.name || "TBD"}
              </p>
              {teamA?.seed ? (
                <span className="text-[10px] text-zinc-500">Seed #{teamA.seed}</span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-xl font-bold text-white tabular-nums">{scoreA}</span>
                </div>
                <button
                  onClick={() => setScoreA(scoreA + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <span className="text-sm text-zinc-600 font-bold">VS</span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-xl font-bold text-white tabular-nums">{scoreB}</span>
                </div>
                <button
                  onClick={() => setScoreB(scoreB + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex-1 text-center">
              <p className={cn(
                "text-sm font-semibold mb-1",
                selectedWinner === teamB?.id ? "text-orange-400" : "text-white"
              )}>
                {teamB?.name || "TBD"}
              </p>
              {teamB?.seed ? (
                <span className="text-[10px] text-zinc-500">Seed #{teamB.seed}</span>
              ) : null}
            </div>
          </div>

          {hasTeams && (
            <div className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 text-center">
                Select Winner
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedWinner(teamA?.id || null)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all",
                    selectedWinner === teamA?.id
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]"
                  )}
                >
                  {teamA?.name || "Team A"}
                </button>
                <button
                  onClick={() => setSelectedWinner(teamB?.id || null)}
                  className={cn(
                    "flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all",
                    selectedWinner === teamB?.id
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.12]"
                  )}
                >
                  {teamB?.name || "Team B"}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasTeams}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all",
                hasTeams
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
              )}
            >
              <Save className="h-3.5 w-3.5" />
              Save Result
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
