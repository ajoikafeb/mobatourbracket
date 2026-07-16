"use client";

import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Match } from "@/lib/types";

interface MatchCardProps {
  match: Match;
  index?: number;
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="p-5 hover:border-orange-500/20 transition-all duration-300 hover:shadow-orange-500/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500 font-medium">
            {match.round}
          </span>
          <StatusBadge status={match.status} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <p className="text-base font-semibold text-white truncate">
              {match.team_a || "TBD"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
              <span className="text-xl font-bold text-white">
                {match.score_a}
              </span>
              <Swords className="h-4 w-4 text-zinc-500" />
              <span className="text-xl font-bold text-white">
                {match.score_b}
              </span>
            </div>
          </div>

          <div className="flex-1 text-left">
            <p className="text-base font-semibold text-white truncate">
              {match.team_b || "TBD"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>BO{match.best_of}</span>
          <span>
            {new Date(match.match_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
