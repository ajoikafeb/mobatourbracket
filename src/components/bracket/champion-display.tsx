"use client";

import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import type { EngineTeam } from "@/engine/types";

interface ChampionDisplayProps {
  team: EngineTeam;
}

export function ChampionDisplay({ team }: ChampionDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
      className="flex flex-col items-center gap-3 flex-shrink-0"
      style={{ width: 200, paddingTop: 40 }}
    >
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400 sm:text-xs">
          <Trophy className="h-3 w-3" />
          Champion
        </span>
      </div>

      <motion.div
        animate={{
          rotate: [0, -3, 3, -3, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 rounded-2xl blur-xl" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-400/30">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="h-full w-full object-cover rounded-2xl"
            />
          ) : (
            <Trophy className="h-8 w-8 text-amber-400" />
          )}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.5 }}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500"
        >
          <Star className="h-2.5 w-2.5 text-white fill-white" />
        </motion.div>
      </motion.div>

      <div className="text-center">
        <p className="text-sm font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent">
          {team.name}
        </p>
        {team.seed > 0 && (
          <p className="text-[9px] text-zinc-500 mt-0.5">
            Seed #{team.seed}
          </p>
        )}
      </div>

      {team.players.length > 0 && (
        <div className="w-full space-y-0.5 mt-1">
          {team.players.slice(0, 5).map((player, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/[0.04]"
            >
              <span className="text-[8px] text-zinc-600 font-medium">{i + 1}</span>
              <span className="text-[10px] text-zinc-400 truncate">{player.username}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
