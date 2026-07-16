"use client";

import { motion } from "framer-motion";
import { Radio, Swords, Trophy, Shield } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentMatch } from "@/hooks/use-matches";
import { cn } from "@/lib/utils";

function TeamCard({
  name,
  score,
  side,
}: {
  name: string;
  score: number;
  side: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1"
    >
      <Card className="p-6 sm:p-8 text-center hover:border-orange-500/20 transition-all duration-300">
        <div
          className={cn(
            "mx-auto mb-4 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-white/5 border border-white/[0.08]",
            side === "right" && "bg-orange-500/5 border-orange-500/10"
          )}
        >
          <Shield
            className={cn(
              "h-10 w-10 sm:h-12 sm:w-12",
              side === "right" ? "text-orange-400" : "text-zinc-400"
            )}
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
          {name || "TBD"}
        </h2>
        <p
          className={cn(
            "text-5xl sm:text-6xl font-black",
            side === "right" ? "text-orange-400" : "text-white"
          )}
        >
          {score}
        </p>
      </Card>
    </motion.div>
  );
}

export default function CurrentMatchPage() {
  const { match, loading } = useCurrentMatch();

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
                <p className="text-sm text-zinc-400">Live match coverage</p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : !match ? (
              <EmptyState
                icon={Radio}
                title="No live match"
                description="There is no match currently being played. Check the schedule for upcoming matches."
              />
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={match.status} />
                    <span className="text-sm text-zinc-500">{match.round}</span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    Best of {match.best_of}
                  </span>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
                  <TeamCard name={match.team_a} score={match.score_a} side="left" />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center justify-center gap-2 px-4"
                  >
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                      <Swords className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      VS
                    </span>
                  </motion.div>

                  <TeamCard name={match.team_b} score={match.score_b} side="right" />
                </div>

                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Match Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Round</p>
                      <p className="text-sm font-medium text-white">
                        {match.round}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Format</p>
                      <p className="text-sm font-medium text-white">
                        BO{match.best_of}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Date</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(match.match_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Time</p>
                      <p className="text-sm font-medium text-white">
                        {new Date(match.match_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </Card>

                {match.winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 rounded-[20px] border border-orange-500/20 bg-orange-500/10 p-6"
                  >
                    <Trophy className="h-6 w-6 text-orange-400" />
                    <span className="text-lg font-bold text-orange-400">
                      Winner: {match.winner}
                    </span>
                  </motion.div>
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
