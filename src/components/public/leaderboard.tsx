"use client";

import { Trophy, Medal, Target, Flame, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LeaderboardEntry } from "@/lib/prediction-types";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  highlight?: string;
}

const rankStyles = [
  "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
  "from-zinc-300/10 to-zinc-400/5 border-zinc-400/20",
  "from-orange-700/10 to-orange-800/5 border-orange-700/20",
];

const rankIcons = [
  <Trophy key="gold" className="h-4 w-4 text-yellow-400" />,
  <Medal key="silver" className="h-4 w-4 text-zinc-300" />,
  <Medal key="bronze" className="h-4 w-4 text-orange-600" />,
];

export function Leaderboard({ leaderboard, highlight }: LeaderboardProps) {
  if (leaderboard.length === 0) {
    return (
      <Card className="p-8 bg-white/[0.03] border-white/[0.06] rounded-[20px] text-center">
        <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No predictions yet</p>
        <p className="text-xs text-zinc-600 mt-1">Be the first to make a prediction!</p>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.03] border-white/[0.06] rounded-[20px] overflow-hidden">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Trophy className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Leaderboard</h3>
            <p className="text-xs text-zinc-500">Top predictors ranked by points</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {leaderboard.map((entry) => {
          const isTop3 = entry.rank <= 3;
          const isHighlight = highlight && entry.discord_username === highlight.toLowerCase();

          return (
            <div
              key={entry.discord_username}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                isHighlight && "bg-orange-500/[0.06]",
                isTop3 && entry.rank === 1 && "bg-gradient-to-r from-yellow-500/[0.04] to-transparent",
                isTop3 && entry.rank === 2 && "bg-gradient-to-r from-zinc-400/[0.03] to-transparent",
                isTop3 && entry.rank === 3 && "bg-gradient-to-r from-orange-700/[0.03] to-transparent"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold shrink-0",
                isTop3
                  ? `bg-gradient-to-br ${rankStyles[entry.rank - 1]} text-white`
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-400"
              )}>
                {isTop3 ? rankIcons[entry.rank - 1] : entry.rank}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold truncate",
                  isHighlight ? "text-orange-400" : "text-white"
                )}>
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
  );
}
