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
  X,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { findPlacements } from "@/engine/tournament-service";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; medal: string }> = {
  1: {
    bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/40",
    text: "text-amber-300",
    medal: "bg-amber-500",
  },
  2: {
    bg: "bg-gradient-to-br from-zinc-300/10 to-zinc-400/5",
    border: "border-zinc-400/30",
    text: "text-zinc-300",
    medal: "bg-zinc-400",
  },
  3: {
    bg: "bg-gradient-to-br from-orange-600/10 to-orange-700/5",
    border: "border-orange-600/30",
    text: "text-orange-400",
    medal: "bg-orange-600",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-zinc-900/30",
  border: "border-zinc-700/20",
  text: "text-zinc-400",
  medal: "bg-zinc-600",
};

function getTeamPlayers(team: Team, playersPerTeam?: number) {
  const allPlayers = [
    { role: "Captain", name: team.captain },
    { role: "Player 1", name: team.player_1 },
    { role: "Player 2", name: team.player_2 },
    { role: "Player 3", name: team.player_3 },
    { role: "Player 4", name: team.player_4 },
    { role: "Player 5", name: team.player_5 },
    { role: "Player 6", name: team.player_6 },
    ...(team.substitute ? [{ role: "Substitute", name: team.substitute }] : []),
  ].filter((p) => p.name);
  if (playersPerTeam) {
    return allPlayers.slice(0, playersPerTeam);
  }
  return allPlayers;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TeamDetailSheet({
  team,
  onClose,
  playersPerTeam,
}: {
  team: Team;
  onClose: () => void;
  playersPerTeam?: number;
}) {
  const players = getTeamPlayers(team, playersPerTeam);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl border border-white/[0.08] p-5",
          "bg-[#18181B]/95 backdrop-blur-xl",
          "sm:rounded-2xl sm:mx-4 pb-8 sm:pb-5"
        )}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/10 mt-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors sm:top-4 sm:right-4"
        >
          <X className="h-4 w-4 text-zinc-400" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
            {team.logo ? (
              <img src={team.logo} alt={team.team_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-zinc-400">{getInitials(team.team_name)}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{team.team_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-400">Seed #{team.seed}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 sm:text-xs">
            Roster
          </p>
          {players.map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[10px] font-semibold text-zinc-500">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{player.name}</p>
              </div>
              {player.role === "Captain" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                  <Star className="h-2.5 w-2.5" />
                  CPT
                </span>
              )}
              {player.role === "Substitute" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  SUB
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AnnounceWinnerPage() {
  const { settings, matches, teams, loading, tournamentState, champion } = useTournament();
  const [topN, setTopN] = useState(8);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (tournamentState !== "completed" || !champion) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
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
  const topOptions = [1, 2, 3, 4, 8];

  return (
    <div className="min-h-screen bg-zinc-950 space-y-8">
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
                    onClick={() => { setTopN(n); setShowDropdown(false); }}
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
                <Card
                  className={cn(
                    "p-5 border cursor-pointer hover:scale-[1.01] transition-all duration-200",
                    style.bg,
                    style.border
                  )}
                  onClick={() => p.team && setSelectedTeam(p.team)}
                >
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
                    <div className="flex items-center gap-2">
                      {p.team && (
                        <Users className="h-4 w-4 text-zinc-600" />
                      )}
                      {p.rank === 1 && <Trophy className="h-8 w-8 text-amber-400" />}
                      {p.rank === 2 && <Medal className="h-8 w-8 text-zinc-400" />}
                      {p.rank === 3 && <Shield className="h-8 w-8 text-orange-600" />}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Team Detail Sheet ──────────────────────── */}
      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailSheet
            team={selectedTeam}
            onClose={() => setSelectedTeam(null)}
            playersPerTeam={settings?.players_per_team}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
