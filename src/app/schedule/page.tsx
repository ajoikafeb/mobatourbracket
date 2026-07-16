"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Swords,
  MapPin,
  Filter,
  Radio,
  CheckCircle2,
  Timer,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMatches } from "@/hooks/use-matches";
import { useSettings } from "@/hooks/use-settings";
import { cn, formatDate, formatTime, isToday, isTomorrow } from "@/lib/utils";
import type { Match } from "@/lib/types";

type StatusFilter = "all" | "upcoming" | "live" | "finished";

function getDateKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateLabel(dateStr: string) {
  if (isToday(dateStr)) return "Today";
  if (isTomorrow(dateStr)) return "Tomorrow";
  return formatDate(dateStr);
}

const statusBorderClass: Record<Match["status"], string> = {
  live: "border-l-red-500",
  finished: "border-l-green-500",
  waiting: "border-l-zinc-500",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } },
};

const groupVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function SchedulePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roundFilter, setRoundFilter] = useState<string>("all");
  const { matches, loading } = useMatches();
  const { settings } = useSettings();

  const availableRounds = useMemo(() => {
    const rounds = [...new Set(matches.map((m) => m.round))].sort(
      (a, b) => {
        const orderA = matches.find((m) => m.round === a)?.round_order ?? 0;
        const orderB = matches.find((m) => m.round === b)?.round_order ?? 0;
        return orderA - orderB;
      }
    );
    return rounds;
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && match.status === "waiting") ||
        (statusFilter === "live" && match.status === "live") ||
        (statusFilter === "finished" && match.status === "finished");

      const roundOk = roundFilter === "all" || match.round === roundFilter;

      return statusOk && roundOk;
    });
  }, [matches, statusFilter, roundFilter]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    for (const match of filteredMatches) {
      const key = getDateKey(match.match_date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredMatches]);

  const matchCountByStatus = useMemo(() => {
    const counts = { all: matches.length, upcoming: 0, live: 0, finished: 0 };
    for (const m of matches) {
      if (m.status === "waiting") counts.upcoming++;
      else if (m.status === "live") counts.live++;
      else if (m.status === "finished") counts.finished++;
    }
    return counts;
  }, [matches]);

  const matchCountByRound = useMemo(() => {
    const counts: Record<string, number> = { all: matches.length };
    for (const m of matches) {
      counts[m.round] = (counts[m.round] || 0) + 1;
    }
    return counts;
  }, [matches]);

  const statusFilters: { label: string; value: StatusFilter; icon: typeof Filter }[] = [
    { label: "All", value: "all", icon: Filter },
    { label: "Upcoming", value: "upcoming", icon: Timer },
    { label: "Live", value: "live", icon: Radio },
    { label: "Finished", value: "finished", icon: CheckCircle2 },
  ];

  function bestOfLabel(bo: number) {
    if (bo === 1) return "BO1";
    if (bo === 3) return "BO3";
    if (bo === 5) return "BO5";
    return `BO${bo}`;
  }

  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

            <div className="flex flex-col gap-6 mb-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
                    <Calendar className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Match Schedule
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                      {filteredMatches.length} of {matches.length} match{matches.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>

                {settings?.timezone && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-mono">{settings.timezone}</span>
                  </div>
                )}
              </div>

              {/* ── Status Filter ────────────────────── */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
                {statusFilters.map((f) => {
                  const Icon = f.icon;
                  const isActive = statusFilter === f.value;
                  const count = matchCountByStatus[f.value];
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                        isActive ? "text-white" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="status-filter"
                          className="absolute inset-0 rounded-xl bg-orange-500/20 border border-orange-500/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {f.label}
                        <span className={cn("ml-0.5 text-xs tabular-nums", isActive ? "text-orange-300/80" : "text-zinc-600")}>
                          {count}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ── Round Filter ─────────────────────── */}
              {availableRounds.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setRoundFilter("all")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      roundFilter === "all"
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/20"
                        : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white hover:border-white/[0.12]"
                    )}
                  >
                    <Swords className="h-3 w-3" />
                    All Rounds
                    <span className="text-[10px] opacity-60">{matchCountByRound.all}</span>
                  </button>
                  {availableRounds.map((round) => (
                    <button
                      key={round}
                      onClick={() => setRoundFilter(round)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        roundFilter === round
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/20"
                          : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white hover:border-white/[0.12]"
                      )}
                    >
                      {round}
                      <span className="text-[10px] opacity-60">{matchCountByRound[round]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : filteredMatches.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No matches found"
                description={
                  statusFilter === "all" && roundFilter === "all"
                    ? "Matches will appear here once they are created."
                    : "No matches match the current filters."
                }
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${statusFilter}-${roundFilter}`}
                  variants={groupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-10"
                >
                  {groupedMatches.map(([dateKey, groupMatches]) => {
                    const dateLabel = getDateLabel(dateKey);
                    const isDateToday = dateLabel === "Today";
                    const isDateTomorrow = dateLabel === "Tomorrow";

                    return (
                      <motion.section key={dateKey} variants={groupVariants}>
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold",
                              isDateToday
                                ? "bg-orange-500/20 text-orange-300 border border-orange-500/20"
                                : isDateTomorrow
                                ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                                : "bg-white/[0.05] text-zinc-300 border border-white/[0.08]"
                            )}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            {dateLabel}
                          </div>
                          <span className="text-xs text-zinc-600">
                            {groupMatches.length} match{groupMatches.length !== 1 ? "es" : ""}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <AnimatePresence mode="popLayout">
                            {groupMatches.map((match) => {
                              const idx = globalIndex++;
                              const isLive = match.status === "live";
                              const isFinished = match.status === "finished";
                              const isWinnerA = isFinished && match.winner === match.team_a;
                              const isWinnerB = isFinished && match.winner === match.team_b;

                              return (
                                <motion.div
                                  key={match.id}
                                  custom={idx}
                                  variants={cardVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  layout
                                  className="group"
                                >
                                  <Card
                                    className={cn(
                                      "p-5 border-l-4 transition-all duration-300",
                                      "hover:border-orange-500/20 hover:shadow-[0_0_30px_rgba(249,115,22,0.06)]",
                                      statusBorderClass[match.status]
                                    )}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                                        <Swords className="h-3.5 w-3.5" />
                                        {match.round}
                                      </span>
                                      <StatusBadge status={match.status} />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 mb-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={cn(
                                              "text-sm sm:text-base font-semibold truncate transition-colors",
                                              isWinnerA ? "text-orange-400" : "text-white"
                                            )}
                                          >
                                            {match.team_a}
                                          </span>
                                          {isWinnerA && <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {isLive || isFinished ? (
                                          <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5">
                                            <span className="text-lg font-bold text-white tabular-nums">{match.score_a}</span>
                                            <span className="text-xs text-zinc-500 font-medium">vs</span>
                                            <span className="text-lg font-bold text-white tabular-nums">{match.score_b}</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-zinc-500">
                                            <ArrowRight className="h-4 w-4" />
                                            <span className="text-xs font-medium">vs</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0 flex justify-end">
                                        <div className="flex items-center gap-2">
                                          {isWinnerB && <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />}
                                          <span
                                            className={cn(
                                              "text-sm sm:text-base font-semibold truncate text-right transition-colors",
                                              isWinnerB ? "text-orange-400" : "text-white"
                                            )}
                                          >
                                            {match.team_b}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                          <Clock className="h-3.5 w-3.5" />
                                          <span className="text-xs font-mono">{formatTime(match.match_date)}</span>
                                        </div>
                                        <span
                                          className={cn(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                                            match.best_of >= 5
                                              ? "border-orange-500/30 bg-orange-500/15 text-orange-300"
                                              : "border-white/[0.08] bg-white/[0.05] text-zinc-400"
                                          )}
                                        >
                                          {bestOfLabel(match.best_of)}
                                        </span>
                                      </div>

                                      {isLive && (
                                        <div className="flex items-center gap-1.5 text-red-400">
                                          <span className="relative flex h-2 w-2">
                                            <motion.span
                                              className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                                              animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                                              transition={{ duration: 1.5, repeat: Infinity }}
                                            />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                          </span>
                                          <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                                        </div>
                                      )}
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </motion.section>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
