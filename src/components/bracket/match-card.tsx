"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { EngineMatch, EngineTeam } from "@/engine/types";
import { TeamTooltip } from "./team-tooltip";

interface MatchCardProps {
  match: EngineMatch;
  onClick?: () => void;
  hoveredTeamId?: string | null;
  onTeamHover?: (teamId: string | null) => void;
  isAdmin?: boolean;
  isFinal?: boolean;
  predictionCounts?: Record<string, number>;
}

function getStatusColor(status: EngineMatch["status"]) {
  switch (status) {
    case "live":
      return "bg-orange-500";
    case "finished":
      return "bg-green-500";
    case "upcoming":
      return "bg-blue-400";
    case "cancelled":
      return "bg-zinc-600";
    default:
      return "bg-zinc-500";
  }
}

function getStatusPulse(status: EngineMatch["status"]) {
  return status === "live";
}

function TeamRow({
  team,
  score,
  isWinner,
  isLoser,
  isHovered,
  onHover,
  side,
  matchStatus,
  predictionCount,
}: {
  team: EngineTeam | null;
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  side: "A" | "B";
  matchStatus: EngineMatch["status"];
  predictionCount?: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const isEmpty = !team;
  const isBye = team?.name === "BYE";

  return (
    <div
      className="relative"
      onMouseEnter={(e) => {
        if (!team || isBye) return;
        setTooltipRect(e.currentTarget.getBoundingClientRect());
        setShowTooltip(true);
        onHover?.(team.id);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        onHover?.(null);
      }}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-200",
          "border border-transparent",
          isEmpty && "opacity-30",
          isBye && "opacity-30 border-dashed border-white/10",
          !isEmpty &&
            !isBye &&
            !isWinner &&
            !isLoser &&
            "hover:bg-white/[0.04]",
          isWinner &&
            matchStatus === "finished" &&
            "bg-orange-500/[0.08] border-orange-500/20",
          isLoser &&
            matchStatus === "finished" &&
            "opacity-50",
          isHovered &&
            !isEmpty &&
            !isBye &&
            "bg-orange-500/[0.06] border-orange-500/20",
          side === "B" && "border-t border-t-white/[0.06]"
        )}
      >
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold flex-shrink-0",
            isWinner
              ? "bg-orange-500/20 text-orange-400"
              : "bg-white/5 text-zinc-500"
          )}
        >
          {team?.seed ? `#${team.seed}` : "-"}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[11px] font-medium truncate leading-tight",
              isEmpty
                ? "text-zinc-600"
                : isBye
                ? "text-zinc-600 italic"
                : isWinner
                ? "text-orange-400"
                : isLoser
                ? "text-zinc-500"
                : "text-white"
            )}
          >
            {isBye ? "BYE" : team?.name || "TBD"}
          </p>
        </div>

        <span
          className={cn(
            "text-[11px] font-bold tabular-nums flex-shrink-0 min-w-[18px] text-center",
            isWinner
              ? "text-orange-400"
              : isLoser
              ? "text-zinc-600"
              : "text-zinc-300"
          )}
        >
          {matchStatus === "finished" || matchStatus === "live" ? score : ""}
        </span>

        {predictionCount !== undefined && predictionCount > 0 && (
          <span className="flex items-center gap-0.5 ml-0.5 px-1 py-0.5 rounded bg-purple-500/15 text-[9px] font-medium text-purple-400 leading-none">
            {predictionCount}
          </span>
        )}
      </div>

      {showTooltip && team && !isBye && tooltipRect && createPortal(
        <TeamTooltip team={team} rect={tooltipRect} />,
        document.body
      )}
    </div>
  );
}

export function MatchCard({
  match,
  onClick,
  hoveredTeamId,
  onTeamHover,
  isAdmin,
  isFinal,
  predictionCounts,
}: MatchCardProps) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isWinnerA = !!(isFinished && match.winnerId === match.teamA?.id);
  const isWinnerB = !!(isFinished && match.winnerId === match.teamB?.id);
  const isLoserA = !!(isFinished && match.winnerId && !isWinnerA);
  const isLoserB = !!(isFinished && match.winnerId && !isWinnerB);

  const teamAPredictions = predictionCounts?.[match.teamA?.id || ""] || 0;
  const teamBPredictions = predictionCounts?.[match.teamB?.id || ""] || 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border transition-all duration-200",
        "bg-[#141416]/90 backdrop-blur-sm",
        isAdmin && "cursor-pointer hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5",
        !isAdmin && "cursor-default",
        isLive && "border-orange-500/40 shadow-lg shadow-orange-500/10",
        isFinished && "border-green-500/15",
        !isLive && !isFinished && "border-white/[0.06] hover:border-white/[0.12]",
        isFinal && isWinnerA && "border-amber-400/30 shadow-xl shadow-amber-500/10",
        isFinal && isWinnerB && "border-amber-400/30 shadow-xl shadow-amber-500/10"
      )}
    >
      <div className="relative">
        <div className="absolute top-1 right-1.5 z-10">
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                getStatusColor(match.status),
                getStatusPulse(match.status) && "animate-pulse"
              )}
            />
          </div>
        </div>

        <TeamRow
          team={match.teamA}
          score={match.scoreA}
          isWinner={isWinnerA}
          isLoser={isLoserA}
          isHovered={hoveredTeamId === match.teamA?.id}
          onHover={onTeamHover || (() => {})}
          side="A"
          matchStatus={match.status}
          predictionCount={teamAPredictions}
        />
        <TeamRow
          team={match.teamB}
          score={match.scoreB}
          isWinner={isWinnerB}
          isLoser={isLoserB}
          isHovered={hoveredTeamId === match.teamB?.id}
          onHover={onTeamHover || (() => {})}
          side="B"
          matchStatus={match.status}
          predictionCount={teamBPredictions}
        />
      </div>

      {isLive && (
        <div className="h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse" />
      )}
    </div>
  );
}
