"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Swords,
  Trophy,
  Users,
  Clock,
  Zap,
  Shield,
  Star,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { Match, Team } from "@/lib/types";

function LiveIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-50" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
      </div>
      <motion.span
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-bold uppercase tracking-widest text-red-400"
      >
        Live
      </motion.span>
      <div className="h-4 w-px bg-white/10" />
      <Zap className="h-3.5 w-3.5 text-orange-400" />
    </motion.div>
  );
}

function TeamSide({
  name,
  seed,
  score,
  side,
  isWinner,
  players,
}: {
  name: string;
  seed: number;
  score: number;
  side: "left" | "right";
  isWinner: boolean;
  players?: string[];
}) {
  const isRight = side === "right";

  return (
    <motion.div
      initial={{ opacity: 0, x: isRight ? 40 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex-1 min-w-0"
    >
      <Card
        className={cn(
          "relative p-6 sm:p-8 rounded-[24px] overflow-hidden transition-all duration-500",
          isWinner &&
            "border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.15)]",
          !isWinner && "hover:border-white/[0.12]"
        )}
      >
        {isWinner && (
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
        )}

        <div className="relative flex flex-col items-center text-center gap-4">
          <div
            className={cn(
              "flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border transition-all duration-300",
              isRight
                ? "bg-orange-500/10 border-orange-500/20"
                : "bg-white/5 border-white/[0.08]"
            )}
          >
            <Shield
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12",
                isRight ? "text-orange-400" : "text-zinc-400"
              )}
            />
          </div>

          <div className="min-w-0 w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate mb-1">
              {name || "TBD"}
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Seed
              </span>
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded",
                  isRight
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-white/10 text-zinc-300"
                )}
              >
                #{seed}
              </span>
            </div>
          </div>

          <div className="w-full pt-2 border-t border-white/[0.06]">
            <p
              className={cn(
                "text-5xl sm:text-6xl font-black tabular-nums",
                isRight ? "text-orange-400" : "text-white"
              )}
            >
              {score}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function VSBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center justify-center gap-2 px-3 sm:px-6 shrink-0 z-10"
    >
      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
        <Swords className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
      </div>
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
        VS
      </span>
    </motion.div>
  );
}

function MatchInfoBar({
  bestOf,
  round,
  matchDate,
}: {
  bestOf: number;
  round: string;
  matchDate: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm">
        <Zap className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-xs font-semibold text-white">
          BO{bestOf}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 backdrop-blur-sm">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-semibold text-red-400 uppercase">
          Live
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm">
        <Clock className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-300">
          {formatDate(matchDate)} &bull; {formatTime(matchDate)}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm">
        <Star className="h-3.5 w-3.5 text-yellow-400" />
        <span className="text-xs font-medium text-zinc-300">{round}</span>
      </div>
    </motion.div>
  );
}

function WinnerAnnouncement({ winner }: { winner: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
        className="relative overflow-hidden rounded-[24px] border border-orange-500/20 bg-orange-500/5 p-8 sm:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5 pointer-events-none" />

        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, x: Math.random() * 100 - 50 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [-20, -60],
              x: (Math.random() - 0.5) * 120,
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1,
            }}
            className="absolute pointer-events-none"
            style={{
              left: `${15 + Math.random() * 70}%`,
              bottom: "20%",
            }}
          >
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i % 2 === 0 ? "bg-orange-400" : "bg-yellow-400"
              )}
            />
          </motion.div>
        ))}

        <div className="relative flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          <div>
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-2">
              Winner
            </p>
            <h3 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              {winner}
            </h3>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TeamDetailPanel({
  team,
  side,
}: {
  team: Team | undefined;
  side: "left" | "right";
}) {
  if (!team) return null;

  const roster = [
    team.player_1,
    team.player_2,
    team.player_3,
    team.player_4,
    team.player_5,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-5 rounded-[20px]">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-zinc-400" />
          <h4 className="text-sm font-semibold text-white">
            {team.team_name} Roster
          </h4>
        </div>
        <div className="space-y-2">
          {roster.map((player, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-zinc-400">
                {idx + 1}
              </span>
              <span className="text-sm text-zinc-300">{player}</span>
              {idx === 0 && (
                <span className="ml-auto text-[10px] font-semibold text-orange-400 uppercase">
                  Captain
                </span>
              )}
            </div>
          ))}
        </div>
        {team.substitute && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 border border-dashed border-white/[0.06]">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-zinc-500">
              S
            </span>
            <span className="text-sm text-zinc-500">{team.substitute}</span>
            <span className="ml-auto text-[10px] font-medium text-zinc-600 uppercase">
              Sub
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function RecentResults({ matches }: { matches: Match[] }) {
  if (matches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            Recent Results
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white gap-1">
          View Full Schedule
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-3">
        {matches.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + idx * 0.1 }}
          >
            <Card className="p-4 rounded-[16px] hover:border-white/[0.12] transition-all duration-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] shrink-0">
                    <Swords className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {m.team_a} vs {m.team_b}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {m.round} &bull; {formatDate(m.match_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-white tabular-nums">
                    {m.score_a}
                  </span>
                  <span className="text-xs text-zinc-600">-</span>
                  <span className="text-sm font-bold text-orange-400 tabular-nums">
                    {m.score_b}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function NextMatchPreview({ match }: { match: Match }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 sm:p-8 rounded-[24px] border-dashed border-white/[0.1]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
            <Clock className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-1">
              Next Match
            </p>
            <h3 className="text-xl font-bold text-white">
              {match.team_a} vs {match.team_b}
            </h3>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-medium text-zinc-300">
                {match.round}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
              <Zap className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-medium text-zinc-300">
                BO{match.best_of}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1">
              <Clock className="h-3 w-3 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">
                {formatDate(match.match_date)} &bull; {formatTime(match.match_date)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function CurrentMatchPage() {
  const { matches, teams, settings, currentMatch: match, loading, champion } = useTournament();

  const [showDetails, setShowDetails] = useState(false);

  const recentFinished = matches.filter((m) => m.status === "finished").slice(-5).reverse();

  const nextMatch = !match
    ? matches
        .filter((m) => m.status === "waiting" && m.team_a_id && m.team_b_id)
        .sort((a, b) => a.round_order - b.round_order || a.match_index - b.match_index)[0] || null
    : null;

  const teamAData = teams.find(
    (t) => t.team_name === match?.team_a || t.id === match?.team_a_id
  );
  const teamBData = teams.find(
    (t) => t.team_name === match?.team_b || t.id === match?.team_b_id
  );

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
                <Radio className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Current Match
                </h1>
                <p className="text-sm text-zinc-400">
                  {match
                    ? "Live match coverage"
                    : settings?.tournament_name || "Live match coverage"}
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : !match ? (
              <div className="space-y-8">
                <EmptyState
                  icon={Radio}
                  title="No Live Match"
                  description="Matches will appear here when they go live."
                />

                {nextMatch && (
                  <NextMatchPreview match={nextMatch} />
                )}

                {recentFinished.length > 0 && (
                  <RecentResults matches={recentFinished} />
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <LiveIndicator />
                  </div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg sm:text-xl font-bold text-white"
                  >
                    {match.round}
                  </motion.h2>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
                  <TeamSide
                    name={match.team_a}
                    seed={teamAData?.seed ?? 0}
                    score={match.score_a}
                    side="left"
                    isWinner={match.winner === match.team_a}
                    players={
                      teamAData
                        ? [teamAData.player_1, teamAData.player_2, teamAData.player_3, teamAData.player_4, teamAData.player_5]
                        : undefined
                    }
                  />

                  <VSBadge />

                  <TeamSide
                    name={match.team_b}
                    seed={teamBData?.seed ?? 0}
                    score={match.score_b}
                    side="right"
                    isWinner={match.winner === match.team_b}
                    players={
                      teamBData
                        ? [teamBData.player_1, teamBData.player_2, teamBData.player_3, teamBData.player_4, teamBData.player_5]
                        : undefined
                    }
                  />
                </div>

                <MatchInfoBar
                  bestOf={match.best_of}
                  round={match.round}
                  matchDate={match.match_date}
                />

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="gap-2"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {showDetails ? "Hide Rosters" : "Show Rosters"}
                  </Button>
                </div>

                <AnimatePresence>
                  {showDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TeamDetailPanel team={teamAData} side="left" />
                      <TeamDetailPanel team={teamBData} side="right" />
                    </div>
                  )}
                </AnimatePresence>

                {match.winner && <WinnerAnnouncement winner={match.winner} />}

                {recentFinished.length > 0 && (
                  <RecentResults matches={recentFinished} />
                )}
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
