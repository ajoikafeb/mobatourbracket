"use client";

import { useEffect, useState } from "react";
import type { EngineTeam } from "@/engine/types";

interface TeamTooltipProps {
  team: EngineTeam;
  position: { x: number; y: number };
}

export function TeamTooltip({ team, position }: TeamTooltipProps) {
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = position.x;
    let y = position.y;

    if (x + 200 > vw) x = vw - 210;
    if (x < 10) x = 10;
    if (y - 220 < 0) y = position.y + 20;
    else y = position.y - 20;

    setAdjustedPos({ x, y });
  }, [position]);

  if (team.players.length === 0 && !team.name) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="w-[200px] rounded-xl border border-white/[0.08] bg-[#1a1a1f]/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.06]">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="h-7 w-7 rounded-lg object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-orange-400">
                {team.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{team.name}</p>
            <p className="text-[9px] text-zinc-500">Seed #{team.seed}</p>
          </div>
        </div>

        {team.players.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Players
            </p>
            {team.players.map((player, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-white/5 text-[8px] text-zinc-500 font-medium">
                  {i + 1}
                </span>
                <span className="text-[11px] text-zinc-300">{player.username}</span>
              </div>
            ))}
          </div>
        )}

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#1a1a1f]/95 border-r border-b border-white/[0.08]" />
      </div>
    </div>
  );
}
