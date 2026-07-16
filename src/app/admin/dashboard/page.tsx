"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Swords,
  Calendar,
  Radio,
  Trophy,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Users,
  Settings,
  Wand2,
  Play,
  RotateCcw,
  Flag,
  ChevronRight,
  Award,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTournament } from "@/hooks/use-tournament";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

const ROUND_ICONS = [Swords, Zap, Swords, Flag, Trophy, Award];

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
      />
    </div>
  );
}

function RoundTrack({ rounds, currentRound, matches }: { rounds: string[]; currentRound: number; matches: Match[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {rounds.map((name, idx) => {
        const roundMatches = matches.filter((m) => m.round_order === idx);
        const allFinished = roundMatches.length > 0 && roundMatches.every((m) => m.status === "finished");
        const isCurrent = idx === currentRound;
        const isPast = idx < currentRound;

        return (
          <div key={name} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                isCurrent
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : allFinished || isPast
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-zinc-800/50 text-zinc-500 border border-zinc-700/30"
              )}
            >
              {allFinished || isPast ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isCurrent ? (
                <Radio className="h-3 w-3 animate-pulse" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {name}
            </div>
            {idx < rounds.length - 1 && (
              <ChevronRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoundMatchRow({ match }: { match: Match }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            isFinished ? "bg-green-500" : isLive ? "bg-red-500 animate-pulse" : "bg-zinc-600"
          )}
        />
        <span className="text-sm text-white">
          {match.team_a || "TBD"} <span className="text-zinc-500">vs</span> {match.team_b || "TBD"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {isFinished && (
          <span className="text-sm font-bold text-orange-400">
            {match.score_a} - {match.score_b}
          </span>
        )}
        <StatusBadge status={match.status} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const {
    settings,
    matches,
    teams,
    loading,
    actionLoading,
    message,
    tournamentState,
    currentRoundOrder,
    currentRoundName,
    currentMatch,
    roundProgress,
    isRoundComplete,
    canProceedToNextRound,
    canFinishTournament,
    champion,
    totalRounds,
    startTournament: doStartTournament,
    proceedToNextRound: doProceedToNextRound,
    finishTournament: doFinishTournament,
    resetAll: doResetAll,
    deleteHistory: doDeleteHistory,
  } = useTournament();

  const totalMatches = matches.length;
  const liveMatches = matches.filter((m) => m.status === "live").length;
  const finishedMatches = matches.filter((m) => m.status === "finished").length;
  const currentRoundMatches = matches
    .filter((m) => m.round_order === currentRoundOrder)
    .sort((a, b) => a.match_index - b.match_index);

  const roundNames = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => {
      const orderA = matches.find((m) => m.round === a)?.round_order ?? 0;
      const orderB = matches.find((m) => m.round === b)?.round_order ?? 0;
      return orderA - orderB;
    }
  );

  const stats = [
    {
      label: "Total Teams",
      value: teams.length,
      icon: Users,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      label: "Total Matches",
      value: totalMatches,
      icon: Swords,
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      label: "Finished",
      value: finishedMatches,
      icon: CheckCircle2,
      color: "bg-green-500/20 text-green-400",
    },
    {
      label: "Live Now",
      value: liveMatches,
      icon: Zap,
      color: "bg-red-500/20 text-red-400",
    },
  ];

  const recentMatches = matches
    .filter((m) => m.status === "finished" || m.status === "live")
    .slice(-5)
    .reverse();

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white">Tournament Control Panel</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Central dashboard — manage tournament flow, rounds, and matches
        </p>
      </motion.div>

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

      {/* ── Tournament Status Banner ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-r from-zinc-900/80 via-zinc-900/50 to-zinc-900/80 border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border",
                    tournamentState === "running"
                      ? "bg-green-500/20 border-green-500/30"
                      : tournamentState === "completed"
                      ? "bg-purple-500/20 border-purple-500/30"
                      : "bg-zinc-500/20 border-zinc-500/30"
                  )}
                >
                  <Trophy
                    className={cn(
                      "h-5 w-5",
                      tournamentState === "running"
                        ? "text-green-400"
                        : tournamentState === "completed"
                        ? "text-purple-400"
                        : "text-zinc-400"
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Tournament State</p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      tournamentState === "running"
                        ? "text-green-400"
                        : tournamentState === "completed"
                        ? "text-purple-400"
                        : "text-zinc-400"
                    )}
                  >
                    {tournamentState === "running"
                      ? "Running"
                      : tournamentState === "completed"
                      ? "Completed"
                      : "Draft"}
                  </p>
                </div>
              </div>

              {tournamentState === "running" && (
                <div className="space-y-3">
                  {/* ── Round Track ──────────────────── */}
                  {roundNames.length > 0 && (
                    <RoundTrack
                      rounds={roundNames}
                      currentRound={currentRoundOrder}
                      matches={matches}
                    />
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500">Current Round:</span>
                    <span className="font-semibold text-white">{currentRoundName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500">Round Progress:</span>
                    <span className="text-white">
                      {roundProgress.completed}/{roundProgress.total} matches
                    </span>
                    <span className="text-orange-400 font-medium">{roundProgress.percentage}%</span>
                  </div>
                  <ProgressBar percentage={roundProgress.percentage} />

                  {canProceedToNextRound && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Round complete — ready for next round!
                    </div>
                  )}
                </div>
              )}

              {tournamentState === "completed" && champion && (
                <div className="flex items-center gap-3 mt-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                    Champion: {champion.team_name}
                  </span>
                </div>
              )}

              {tournamentState === "draft" && (
                <p className="text-sm text-zinc-400 mt-1">
                  Generate a bracket and schedule to get started.
                </p>
              )}
            </div>

            {/* ── Action Buttons ────────────────────── */}
            <div className="flex flex-wrap gap-3">
              {tournamentState === "draft" && (
                <Button
                  onClick={doStartTournament}
                  disabled={actionLoading || totalMatches === 0}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4" />
                  Start Tournament
                </Button>
              )}

              {tournamentState === "running" && canProceedToNextRound && (
                <Button
                  onClick={doProceedToNextRound}
                  disabled={actionLoading}
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white animate-pulse"
                >
                  <ArrowRight className="h-4 w-4" />
                  Start Next Round
                </Button>
              )}

              {tournamentState === "running" && canFinishTournament && (
                <Button
                  onClick={doFinishTournament}
                  disabled={actionLoading}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Flag className="h-4 w-4" />
                  Finish Tournament
                </Button>
              )}

              {tournamentState === "completed" && (
                <Link href="/admin/announce">
                  <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    <Award className="h-4 w-4" />
                    Announce Winner
                  </Button>
                </Link>
              )}

              {tournamentState !== "draft" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset entire tournament? This cannot be undone.")) {
                      doResetAll();
                    }
                  }}
                  disabled={actionLoading}
                  className="gap-2 border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/30"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}

              {tournamentState === "draft" && totalMatches > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Delete ALL tournament data (teams, matches, brackets)? This cannot be undone.")) {
                      doDeleteHistory();
                    }
                  }}
                  disabled={actionLoading}
                  className="gap-2 border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete History
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Stats Grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="p-5 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Current Match ──────────────────────────── */}
      {currentMatch && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/admin/current-match">
            <Card className="p-6 bg-gradient-to-r from-red-500/10 via-zinc-900/50 to-orange-500/10 border-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-2 w-2 items-center justify-center rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                  Current Match
                </span>
                <Radio className="h-4 w-4 text-red-400 ml-auto" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{currentMatch.team_a}</p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">{currentMatch.score_a}</p>
                </div>
                <div className="text-center px-6">
                  <p className="text-xs text-zinc-500 mb-1">vs</p>
                  <StatusBadge status={currentMatch.status} />
                  <p className="text-xs text-zinc-400 mt-2">{currentMatch.round}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{currentMatch.team_b}</p>
                  <p className="text-3xl font-bold text-orange-400 mt-1">{currentMatch.score_b}</p>
                </div>
              </div>
              <div className="flex items-center justify-center mt-4 text-xs text-zinc-500 group-hover:text-orange-400 transition-colors">
                <span>Click to update</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* ── Current Round Matches ──────────────────── */}
      {tournamentState === "running" && currentRoundMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Swords className="h-4 w-4 text-orange-400" />
            {currentRoundName} — Matches
          </h3>
          <Card className="bg-zinc-900/50 border-zinc-800 divide-y divide-zinc-800">
            {currentRoundMatches.map((match) => (
              <RoundMatchRow key={match.id} match={match} />
            ))}
          </Card>
        </motion.div>
      )}

      {/* ── Quick Actions ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              href: "/admin/tournament-generator",
              label: "Tournament Generator",
              icon: Wand2,
              color: "bg-orange-500/20 text-orange-400",
              highlight: true,
            },
            {
              href: "/admin/schedule-generator",
              label: "Schedule Generator",
              icon: Calendar,
              color: "bg-blue-500/20 text-blue-400",
              highlight: false,
            },
            {
              href: "/admin/bracket",
              label: "Edit Bracket",
              icon: Swords,
              color: "bg-orange-500/20 text-orange-400",
              highlight: false,
            },
            {
              href: "/admin/current-match",
              label: "Current Match",
              icon: Radio,
              color: "bg-red-500/20 text-red-400",
              highlight: false,
            },
            {
              href: "/admin/schedule",
              label: "Edit Schedule",
              icon: Clock,
              color: "bg-green-500/20 text-green-400",
              highlight: false,
            },
            {
              href: "/admin/settings",
              label: "Settings",
              icon: Settings,
              color: "bg-purple-500/20 text-purple-400",
              highlight: false,
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card
                  className={`p-5 transition-all duration-300 group cursor-pointer ${
                    action.highlight
                      ? "bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30 hover:border-orange-500/50 col-span-2 lg:col-span-1"
                      : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} ${
                        action.highlight ? "h-14 w-14" : ""
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${action.highlight ? "h-7 w-7" : ""}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-white ${action.highlight ? "text-lg" : "text-sm"}`}>
                        {action.label}
                      </p>
                      {action.highlight && (
                        <p className="text-xs text-orange-400 mt-0.5">Generate brackets</p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ── Recent Activity ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
        <Card className="bg-zinc-900/50 border-zinc-800 divide-y divide-zinc-800">
          {recentMatches.length > 0 ? (
            recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={match.status} />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {match.team_a} vs {match.team_b}
                    </p>
                    <p className="text-xs text-zinc-500">{match.round}</p>
                  </div>
                </div>
                <div className="text-right">
                  {match.status === "finished" ? (
                    <p className="text-sm font-bold text-white">
                      {match.score_a} - {match.score_b}
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 animate-pulse">LIVE</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500">No recent matches</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
