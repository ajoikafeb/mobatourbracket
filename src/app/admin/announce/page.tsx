"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Medal,
  ArrowLeft,
  Crown,
  Star,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { findPlacements } from "@/engine/tournament-service";
import { cn } from "@/lib/utils";

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; icon: string; medal: string }> = {
  1: {
    bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/40",
    text: "text-amber-300",
    icon: "text-amber-400",
    medal: "bg-amber-500",
  },
  2: {
    bg: "bg-gradient-to-br from-zinc-300/10 to-zinc-400/5",
    border: "border-zinc-400/30",
    text: "text-zinc-300",
    icon: "text-zinc-400",
    medal: "bg-zinc-400",
  },
  3: {
    bg: "bg-gradient-to-br from-orange-600/10 to-orange-700/5",
    border: "border-orange-600/30",
    text: "text-orange-400",
    icon: "text-orange-500",
    medal: "bg-orange-600",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-zinc-900/30",
  border: "border-zinc-700/20",
  text: "text-zinc-400",
  icon: "text-zinc-500",
  medal: "bg-zinc-600",
};

export default function AnnounceWinnerPage() {
  const { settings, matches, teams, loading, tournamentState, champion } = useTournament();
  const [topN, setTopN] = useState(8);
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (tournamentState !== "completed" || !champion) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tournament Not Complete</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Complete the tournament first to announce the winner.
          </p>
          <Link href="/admin/dashboard">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const placements = findPlacements(matches, teams, topN);
  const hasGrandFinal = matches.some((m) => m.round === "Grand Final" && m.status === "finished");

  const topOptions = [1, 2, 3, 4, 8];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-8">
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Announce Winner</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {settings?.tournament_name || "Tournament"} — Final Standings
          </p>
        </div>

        {/* ── Top N Selector ──────────────────── */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900/50 text-sm text-white hover:border-orange-500/30 transition-colors"
          >
            Show Top {topN}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showDropdown && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {topOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setTopN(n);
                      setShowDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left hover:bg-zinc-800 transition-colors",
                      n === topN ? "text-orange-400 bg-zinc-800/50" : "text-white"
                    )}
                  >
                    Top {n}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Champion Card ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="p-8 bg-gradient-to-br from-amber-500/10 via-zinc-900/50 to-orange-500/10 border-amber-500/30 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Crown className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            </motion.div>
            <p className="text-xs text-amber-400 uppercase tracking-[0.3em] font-semibold mb-2">
              Champion
            </p>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent mb-2">
              {champion.team_name}
            </h2>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Medal className="h-4 w-4 text-amber-400" />
                Seed #{champion.seed}
              </span>
              <span>•</span>
              <span>{champion.captain}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Full Standings ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-orange-400" />
          Final Standings — Top {topN}
        </h3>
        <div className="space-y-3">
          {placements.map((p, i) => {
            const style = RANK_STYLES[p.rank] || DEFAULT_STYLE;
            return (
              <motion.div
                key={p.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <Card className={cn("p-5 border", style.bg, style.border)}>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg",
                        style.medal,
                        p.rank <= 3 ? "text-white" : "text-zinc-300"
                      )}
                    >
                      #{p.rank}
                    </div>
                    <div className="flex-1">
                      {p.team ? (
                        <>
                          <p className={cn("text-lg font-bold", style.text)}>
                            {p.team.team_name}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Captain: {p.team.captain} • Seed #{p.team.seed}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg text-zinc-600 italic">No data</p>
                      )}
                    </div>
                    {p.rank === 1 && <Trophy className="h-8 w-8 text-amber-400" />}
                    {p.rank === 2 && <Medal className="h-8 w-8 text-zinc-400" />}
                    {p.rank === 3 && <Shield className="h-8 w-8 text-orange-600" />}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
