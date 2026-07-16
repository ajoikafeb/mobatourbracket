"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PageWrapper } from "@/components/shared/page-wrapper";
import { MatchCard } from "@/components/shared/match-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useMatches } from "@/hooks/use-matches";
import { isToday, isTomorrow } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterType = "all" | "today" | "tomorrow";

export default function SchedulePage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const { matches, loading } = useMatches();

  const filteredMatches = matches.filter((match) => {
    if (filter === "today") return isToday(match.match_date);
    if (filter === "tomorrow") return isTomorrow(match.match_date);
    return true;
  });

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AnimatedBackground />
      <Navbar />

      <main className="relative z-10">
        <PageWrapper>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
                  <Calendar className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Match Schedule
                  </h1>
                  <p className="text-sm text-zinc-400">
                    {matches.length} total matches
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                      filter === f.value
                        ? "text-white"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {filter === f.value && (
                      <motion.div
                        layoutId="schedule-filter"
                        className="absolute inset-0 rounded-xl bg-orange-500/20 border border-orange-500/20"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : filteredMatches.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No matches found"
                description={
                  filter === "all"
                    ? "No matches have been scheduled yet."
                    : `No matches scheduled for ${filter}.`
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            )}
          </div>
        </PageWrapper>
      </main>

      <Footer />
    </div>
  );
}
