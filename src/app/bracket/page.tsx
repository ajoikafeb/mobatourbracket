"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useTournament } from "@/hooks/use-tournament";
import { BracketView } from "@/components/bracket/bracket-view";
import { getPredictionCountsByMatch } from "@/services/prediction-service";
import type { PredictionCountMap } from "@/services/prediction-service";

export default function BracketPage() {
  const { bracket, settings, loading } = useTournament();
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [predictionCounts, setPredictionCounts] = useState<PredictionCountMap>({});

  useEffect(() => {
    if (bracket.matches.length === 0) return;
    const matchIds = bracket.matches.map((m) => m.id);
    getPredictionCountsByMatch([...new Set(matchIds)]).then(setPredictionCounts);
  }, [bracket.matches]);

  const handleTeamHover = useCallback((teamId: string | null) => {
    setHoveredTeamId(teamId);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="flex items-center gap-4 mb-10 sm:mb-12">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-500/20 sm:h-14 sm:w-14"
              >
                <Swords className="h-6 w-6 text-orange-400 sm:h-7 sm:w-7" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {settings?.tournament_name || "Tournament Bracket"}
                </h1>
                <p className="text-sm text-zinc-400">
                  Single Elimination
                  {bracket.config.bracketSize > 0 && (
                    <> — {bracket.config.bracketSize} slots</>
                  )}
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : bracket.matches.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="No bracket yet"
                description="The tournament bracket hasn't been created yet. Check back soon!"
              />
            ) : (
              <BracketView
                bracket={bracket}
                hoveredTeamId={hoveredTeamId}
                onTeamHover={handleTeamHover}
                predictionCounts={predictionCounts}
              />
            )}
          </div>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
