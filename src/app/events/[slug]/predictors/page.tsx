"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, Trophy, Medal, Target, Flame, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/hooks/use-events";
import { useLeaderboard } from "@/hooks/use-predictions";
import { cn } from "@/lib/utils";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const PAGE_SIZE = 20;

const rankStyles = [
  "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
  "from-zinc-300/10 to-zinc-400/5 border-zinc-400/20",
  "from-orange-700/10 to-orange-800/5 border-orange-700/20",
];

export default function PredictorsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { event, loading: eventLoading } = useEvent(slug);
  const [page, setPage] = useState(1);

  const eventId = event?.id || null;
  const { leaderboard, loading: leaderboardLoading } = useLeaderboard(eventId);

  const totalPages = Math.max(1, Math.ceil(leaderboard.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeaderboard = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return leaderboard.slice(start, start + PAGE_SIZE);
  }, [leaderboard, currentPage]);

  const isLoading = eventLoading || leaderboardLoading;

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          {isLoading ? (
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
              <Skeleton className="h-6 w-32 mb-8" />
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-16 w-full rounded-[16px]" />
              <Skeleton className="h-16 w-full rounded-[16px]" />
              <Skeleton className="h-16 w-full rounded-[16px]" />
            </div>
          ) : !event ? (
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-32 text-center">
              <p className="text-2xl font-bold text-white mb-3">Event Not Found</p>
              <Link href="/events">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
              <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
                <Link
                  href={`/events/${slug}/predict`}
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors duration-200 mb-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Predictions
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <Users className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Predictors</h1>
                    <p className="text-sm text-zinc-400">{event.title}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible" className="mb-6">
                <Card className="p-4 bg-white/[0.03] border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    <span className="font-bold text-white">{leaderboard.length}</span> predictor{leaderboard.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Page {currentPage} of {totalPages}
                  </p>
                </Card>
              </motion.div>

              {leaderboard.length === 0 ? (
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible">
                  <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
                    <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No predictors yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Be the first to make a prediction!</p>
                  </Card>
                </motion.div>
              ) : (
                <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible">
                  <Card className="bg-white/[0.03] border-white/[0.06] rounded-[20px] overflow-hidden">
                    <div className="divide-y divide-white/[0.06]">
                      {paginatedLeaderboard.map((entry) => {
                        const isTop3 = entry.rank <= 3;
                        return (
                          <div
                            key={entry.discord_username}
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 transition-colors",
                              isTop3 && entry.rank === 1 && "bg-gradient-to-r from-yellow-500/[0.04] to-transparent",
                              isTop3 && entry.rank === 2 && "bg-gradient-to-r from-zinc-400/[0.03] to-transparent",
                              isTop3 && entry.rank === 3 && "bg-gradient-to-r from-orange-700/[0.03] to-transparent"
                            )}
                          >
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold shrink-0",
                              isTop3
                                ? `bg-gradient-to-br ${rankStyles[entry.rank - 1]} text-white`
                                : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
                            )}>
                              {isTop3 ? (
                                entry.rank === 1 ? <Trophy className="h-4 w-4 text-yellow-400" /> :
                                <Medal className="h-4 w-4 text-zinc-300" />
                              ) : entry.rank}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {entry.discord_username}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                                  <Target className="h-3 w-3" />
                                  {entry.accuracy.toFixed(0)}% accuracy
                                </span>
                                {entry.current_streak > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-orange-400">
                                    <Flame className="h-3 w-3" />
                                    {entry.current_streak} streak
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-lg font-extrabold text-white tabular-nums">
                                {entry.points}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {entry.correct_predictions}W / {entry.wrong_predictions}L
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </motion.div>
              )}

              {totalPages > 1 && (
                <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce<(number | "...")[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span key={`dots-${i}`} className="text-zinc-600 px-1 text-sm">...</span>
                        ) : (
                          <Button
                            key={p}
                            variant={currentPage === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(p as number)}
                            className={cn(
                              "w-8 h-8 p-0",
                              currentPage === p && "bg-orange-500 hover:bg-orange-600 text-white"
                            )}
                          >
                            {p}
                          </Button>
                        )
                      )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
