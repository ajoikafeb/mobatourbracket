"use client";

import { useEffect, useState, useRef } from "react";
import type { EngineTeam } from "@/engine/types";

interface TeamTooltipProps {
  team: EngineTeam;
  rect: DOMRect;
}

export function TeamTooltip({ team, rect }: TeamTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const vw = window.innerWidth;
    const tooltipW = ref.current?.offsetWidth || 200;
    const tooltipH = ref.current?.offsetHeight || 160;

    let x = rect.right + 10;
    let y = rect.top + rect.height / 2 - tooltipH / 2;

    if (x + tooltipW > vw - 10) x = rect.left - tooltipW - 10;
    if (y < 10) y = 10;
    if (y + tooltipH > window.innerHeight - 10) y = window.innerHeight - tooltipH - 10;

    setPos({ x, y });
  }, [rect]);

  if (!team.name) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[9999] pointer-events-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="w-[180px] rounded-xl border border-orange-500/20 bg-[#141416]/98 backdrop-blur-xl p-3 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.08]">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="h-6 w-6 rounded-lg object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-[9px] font-bold text-orange-400">
                {team.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{team.name}</p>
            <p className="text-[9px] text-zinc-500">Seed #{team.seed}</p>
          </div>
        </div>

        {team.players.length > 0 && (
          <div className="space-y-1">
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
      </div>
    </div>
  );
}
