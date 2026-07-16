"use client";

import { motion } from "framer-motion";
import {
  Undo2,
  Redo2,
  RotateCcw,
  RefreshCw,
  Trophy,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngineBracketStats } from "@/engine/types";

interface BracketToolbarProps {
  stats: EngineBracketStats;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onRegenerate: () => void;
}

export function BracketToolbar({
  stats,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetAll,
  onRegenerate,
}: BracketToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            canUndo
              ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              : "text-zinc-700 cursor-not-allowed"
          )}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            canRedo
              ? "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              : "text-zinc-700 cursor-not-allowed"
          )}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-white/[0.06]" />

      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-400">
            <span className="font-semibold text-white">{stats.completedMatches}</span>
            /{stats.totalMatches} matches
          </span>
        </div>
        <div className="h-3 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[11px] text-zinc-400">
            <span className="font-semibold text-orange-400">{stats.progress}%</span> complete
          </span>
        </div>
        {stats.liveMatches > 0 && (
          <>
            <div className="h-3 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] text-orange-400 font-semibold">
                {stats.liveMatches} live
              </span>
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetAll}
          className="gap-1.5 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/30"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          className="gap-1.5 border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-500/30"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
