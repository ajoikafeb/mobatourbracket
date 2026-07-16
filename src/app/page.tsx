"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Swords,
  Calendar,
  Radio,
  ArrowRight,
  Zap,
  Users,
  Target,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentMatch } from "@/hooks/use-matches";
import { useSettings } from "@/hooks/use-settings";

export default function HomePage() {
  const { match: currentMatch } = useCurrentMatch();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-400"
              >
                <Zap className="h-4 w-4" />
                {settings?.tournament_status === "ongoing"
                  ? "Tournament is Live"
                  : settings?.tournament_status === "completed"
                  ? "Tournament Completed"
                  : "Tournament Starting Soon"}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
              >
                <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                  {settings?.tournament_name || "Neosoul"}
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Tournament Tracker
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto"
              >
                {settings?.tournament_subtitle ||
                  "Community Mobile MOBA Tournament — Track brackets, schedules, and live matches in real-time."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link href="/bracket">
                  <Button size="xl" className="w-full sm:w-auto">
                    <Swords className="h-5 w-5" />
                    View Bracket
                  </Button>
                </Link>
                <Link href="/schedule">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    <Calendar className="h-5 w-5" />
                    View Schedule
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link href="/current-match">
                  <Card className="p-6 hover:border-orange-500/20 transition-all duration-300 hover:shadow-orange-500/5 group h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                        <Radio className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Live Match
                        </h3>
                        <p className="text-xs text-zinc-500">Now Playing</p>
                      </div>
                    </div>
                    {currentMatch ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white truncate">
                            {currentMatch.team_a}
                          </p>
                          <p className="text-sm font-medium text-white truncate">
                            {currentMatch.team_b}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-white">
                            {currentMatch.score_a}
                          </span>
                          <Swords className="h-4 w-4 text-zinc-500" />
                          <span className="text-2xl font-bold text-white">
                            {currentMatch.score_b}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No live match</p>
                    )}
                    <div className="mt-4 flex items-center gap-1 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
                      Watch now <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Link href="/bracket">
                  <Card className="p-6 hover:border-orange-500/20 transition-all duration-300 hover:shadow-orange-500/5 group h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                        <Swords className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Tournament Bracket
                        </h3>
                        <p className="text-xs text-zinc-500">View bracket</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          Single Elimination
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
                      View bracket <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Link href="/schedule">
                  <Card className="p-6 hover:border-orange-500/20 transition-all duration-300 hover:shadow-orange-500/5 group h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                        <Calendar className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Match Schedule
                        </h3>
                        <p className="text-xs text-zinc-500">All matches</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm text-zinc-400">
                          Upcoming matches
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-orange-400 group-hover:text-orange-300 transition-colors">
                      View schedule <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
            <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-br from-orange-500/10 via-[#09090B] to-[#09090B] p-8 sm:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
              <div className="relative z-10 text-center">
                <Trophy className="h-16 w-16 text-orange-400 mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Championship Arena
                </h2>
                <p className="max-w-lg mx-auto text-zinc-400 mb-8">
                  Every match matters. Every play counts. Follow the journey from
                  the first round to the grand finals.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {["Round of 16", "Quarter Final", "Semi Final", "Grand Final"].map(
                    (round) => (
                      <div
                        key={round}
                        className="rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2 text-sm text-zinc-300"
                      >
                        {round}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
