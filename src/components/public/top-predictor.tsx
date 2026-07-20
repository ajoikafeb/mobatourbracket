"use client";

import Link from "next/link";
import { Trophy, Target, Flame, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/lib/prediction-types";
import { cn } from "@/lib/utils";

interface TopPredictorProps {
  topPredictors: LeaderboardEntry[];
}

const rankBadges = [
  { bg: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30", text: "text-yellow-400", icon: "1st" },
  { bg: "from-zinc-300/10 to-zinc-400/5 border-zinc-400/20", text: "text-zinc-300", icon: "2nd" },
  { bg: "from-orange-700/10 to-orange-800/5 border-orange-700/20", text: "text-orange-400", icon: "3rd" },
];

export function TopPredictor({ topPredictors }: TopPredictorProps) {
  if (topPredictors.length === 0) {
    return (
      <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
        <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No predictions yet</p>
        <p className="text-xs text-zinc-600 mt-1">Predictions will appear once users start predicting</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/[0.03] border-white/[0.06] rounded-[20px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Trophy className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Top Predictors</h3>
          <p className="text-xs text-zinc-500">Best prediction accuracy</p>
        </div>
      </div>

      <div className="space-y-3">
        {topPredictors.map((entry, i) => {
          const badge = rankBadges[i] || rankBadges[0];
          return (
            <div
              key={entry.discord_username}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 bg-gradient-to-r transition-all",
                badge.bg
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold",
                badge.bg, badge.text
              )}>
                {badge.icon}
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

              <div className="text-right">
                <p className="text-xl font-extrabold text-white tabular-nums">
                  {entry.points}
                </p>
                <p className="text-[10px] text-zinc-500">points</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
