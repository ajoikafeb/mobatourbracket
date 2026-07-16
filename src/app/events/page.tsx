"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Crown,
  Medal,
  Swords,
  Users,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTournament } from "@/hooks/use-tournament";
import { findPlacements } from "@/engine";
import { formatDate, cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

function getTeamRoster(team: Team) {
  const roster: { name: string; isCaptain: boolean; isSubstitute: boolean }[] = [];
  if (team.captain) roster.push({ name: team.captain, isCaptain: true, isSubstitute: false });
  const players = [team.player_1, team.player_2, team.player_3, team.player_4, team.player_5, team.player_6].filter(Boolean);
  for (const p of players) {
    if (p !== team.captain) {
      roster.push({ name: p, isCaptain: false, isSubstitute: false });
    }
  }
  if (team.substitute) {
    roster.push({ name: team.substitute, isCaptain: false, isSubstitute: true });
  }
  return roster;
}

const placementIcons = [Crown, Trophy, Medal, Star, Star, Star, Star, Star];
const placementColors = [
  "text-yellow-400",
  "text-zinc-300",
  "text-orange-300",
  "text-zinc-500",
  "text-zinc-500",
  "text-zinc-500",
  "text-zinc-500",
  "text-zinc-500",
];

export default function EventsPage() {
  const { settings, matches, teams, loading } = useTournament();

  const placements = useMemo(() => {
    if (matches.length === 0) return [];
    return findPlacements(matches, teams, 8);
  }, [matches, teams]);

  const isTournamentFinished = settings?.tournament_status === "completed";
  const isTournamentIdle = !settings?.tournament_status || settings.tournament_status === "upcoming";

  function bestOfLabel(bo: number) {
    if (bo === 1) return "BO1";
    if (bo === 3) return "BO3";
    if (bo === 5) return "BO5";
    return `BO${bo}`;
  }

  const finishedMatches = matches.filter((m) => m.status === "finished");

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">

            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/20">
                <Trophy className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Event History
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Tournament results and placements
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : isTournamentIdle ? (
              <EmptyState
                icon={Swords}
                title="No tournament yet"
                description="Tournament results will appear here once a tournament is finished."
              />
            ) : (
              <div className="space-y-8">

                {/* Tournament Status Banner */}
                <Card className={cn(
                  "p-6 border-l-4",
                  isTournamentFinished ? "border-l-green-500" : "border-l-orange-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {settings?.tournament_name || "Current Tournament"}
                      </h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        {isTournamentFinished ? "Tournament completed" : "Tournament in progress"}
                        {settings?.tournament_start_date && (
                          <> &middot; Started {formatDate(settings.tournament_start_date)}</>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={isTournamentFinished ? "finished" : "live"} />
                  </div>
                </Card>

                {/* Placements */}
                {isTournamentFinished && placements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                      Final Placements
                    </h3>
                    <div className="space-y-3">
                      {placements.map((p, idx) => {
                        const Icon = placementIcons[idx] || Star;
                        const color = placementColors[idx] || "text-zinc-500";
                        const teamData = p.team as Team | null;
                        const roster = teamData ? getTeamRoster(teamData) : [];
                        const teamName = teamData?.team_name || "Unknown";

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                          >
                            <Card className={cn(
                              "p-4 flex items-center gap-4",
                              idx === 0 && "border-yellow-500/30 bg-yellow-500/[0.04]"
                            )}>
                              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]", color)}>
                                <span className="text-lg font-bold">#{p.rank}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-base font-semibold", idx === 0 ? "text-yellow-300" : "text-white")}>
                                    {teamName}
                                  </span>
                                  <Icon className={cn("h-4 w-4", color)} />
                                </div>
                                {roster.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {roster.map((pl, pi) => (
                                      <span
                                        key={pi}
                                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400 border border-white/[0.06]"
                                      >
                                        <Users className="h-2.5 w-2.5" />
                                        {pl.name}
                                        {pl.isCaptain && (
                                          <Crown className="h-2.5 w-2.5 text-yellow-400" />
                                        )}
                                        {pl.isSubstitute && (
                                          <span className="text-[9px] text-zinc-500">(sub)</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Match History */}
                {finishedMatches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                      Match Results
                    </h3>
                    <div className="space-y-2">
                      {finishedMatches
                        .sort((a, b) => {
                          const dateA = new Date(a.match_date).getTime();
                          const dateB = new Date(b.match_date).getTime();
                          return dateA - dateB;
                        })
                        .map((match) => {
                          const isWinnerA = match.winner === match.team_a;
                          const isWinnerB = match.winner === match.team_b;

                          return (
                            <Card key={match.id} className="p-3 flex items-center gap-4 border-l-4 border-l-green-500">
                              <span className="text-[11px] text-zinc-500 font-mono w-20 shrink-0 hidden sm:block">
                                {formatDate(match.match_date)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 w-12 shrink-0">
                                <Swords className="h-3 w-3" />
                                {match.round}
                              </span>
                              <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                                <span className={cn(
                                  "text-sm font-medium truncate",
                                  isWinnerA ? "text-orange-400" : "text-zinc-400"
                                )}>
                                  {match.team_a}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={cn("text-sm font-bold tabular-nums", isWinnerA ? "text-orange-400" : "text-white")}>{match.score_a}</span>
                                  <span className="text-[10px] text-zinc-600">vs</span>
                                  <span className={cn("text-sm font-bold tabular-nums", isWinnerB ? "text-orange-400" : "text-white")}>{match.score_b}</span>
                                </div>
                                <span className={cn(
                                  "text-sm font-medium truncate text-right",
                                  isWinnerB ? "text-orange-400" : "text-zinc-400"
                                )}>
                                  {match.team_b}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/[0.05] text-zinc-400 border border-white/[0.06] shrink-0 hidden sm:block">
                                {bestOfLabel(match.best_of)}
                              </span>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
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
