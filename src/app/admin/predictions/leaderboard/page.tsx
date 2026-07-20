"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Target,
  Flame,
  Download,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaderboard } from "@/hooks/use-predictions";
import { getEventById } from "@/services/event-service";
import { exportPredictionsCSV } from "@/services/prediction-service";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const rankStyles = [
  "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
  "from-zinc-300/10 to-zinc-400/5 border-zinc-400/20",
  "from-orange-700/10 to-orange-800/5 border-orange-700/20",
];

export default function AdminLeaderboardPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");
  const [event, setEvent] = useState<Event | null>(null);
  const { leaderboard, loading } = useLeaderboard(eventId);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then(setEvent);
  }, [eventId]);

  const handleExport = useCallback(async () => {
    if (!eventId) return;
    try {
      const csv = await exportPredictionsCSV(eventId);
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leaderboard-${event?.title || eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [eventId, event]);

  if (!eventId) {
    return (
      <div className="space-y-6">
        <Link href="/admin/predictions" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-2">
          <ArrowLeft className="h-3 w-3" /> Back to Predictions
        </Link>
        <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
          <Target className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No event selected</p>
          <p className="text-xs text-zinc-600 mt-1">Go to Predictions and click Leaderboard on an event</p>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-sm text-zinc-400">
              {event ? event.title : "Loading..."}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/[0.04] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
            <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No predictions yet</p>
            <p className="text-xs text-zinc-600 mt-1">Leaderboard will appear once users start predicting</p>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="bg-white/[0.03] border-white/[0.06] rounded-[20px] overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {leaderboard.map((entry) => {
                const isTop3 = entry.rank <= 3;
                return (
                  <div
                    key={entry.discord_username}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4",
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
                      <div className="flex items-center gap-4 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Target className="h-3 w-3" />
                          {entry.accuracy.toFixed(1)}% accuracy
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {entry.correct_predictions}W / {entry.wrong_predictions}L
                        </span>
                        {entry.current_streak > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-orange-400">
                            <Flame className="h-3 w-3" />
                            {entry.current_streak} streak
                          </span>
                        )}
                        {entry.best_streak > 0 && (
                          <span className="text-[11px] text-zinc-600">
                            Best: {entry.best_streak}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extrabold text-white tabular-nums">
                        {entry.points}
                      </p>
                      <p className="text-[10px] text-zinc-500">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
