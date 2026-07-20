"use client";

import { Swords, Lock, CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PredictableMatch, PredictionStatus } from "@/lib/prediction-types";
import { PREDICTION_STATUS_CONFIG } from "@/lib/prediction-types";
import { cn, formatDate, formatTime } from "@/lib/utils";

interface PredictionCardProps {
  data: PredictableMatch;
  selectedTeamId: string | null;
  onSelect: (matchId: string, teamId: string) => void;
}

const statusIconMap: Record<PredictionStatus, typeof Swords> = {
  open: Swords,
  locked: Lock,
  calculated: CheckCircle2,
  cancelled: Ban,
};

export function PredictionCard({ data, selectedTeamId, onSelect }: PredictionCardProps) {
  const { match, teamA, teamB, predictionStatus, userPrediction } = data;
  const config = PREDICTION_STATUS_CONFIG[predictionStatus];
  const StatusIcon = statusIconMap[predictionStatus];
  const isDisabled = predictionStatus !== "open";
  const hasBothTeams = !!(teamA && teamB);

  const effectiveSelection = userPrediction?.selected_team_id || selectedTeamId;

  return (
    <Card className={cn(
      "p-5 sm:p-6 bg-white/[0.03] border-white/[0.06] rounded-[20px] transition-all duration-300",
      predictionStatus === "open" && "hover:border-white/[0.12]",
      predictionStatus === "cancelled" && "opacity-50"
    )}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {match.round}
          </span>
          <Badge className={cn(config.color, "gap-1")}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        {!hasBothTeams ? (
          <div className="py-4 text-center">
            <p className="text-sm text-zinc-500">
              {predictionStatus === "cancelled" ? "This match has been cancelled" : "Waiting for opponent"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <button
              onClick={() => !isDisabled && hasBothTeams && onSelect(match.id, teamA!.id)}
              disabled={isDisabled}
              className={cn(
                "group rounded-xl border p-3 sm:p-4 text-left transition-all duration-200",
                effectiveSelection === teamA!.id
                  ? "border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(255,122,0,0.1)]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                isDisabled && "cursor-default opacity-70 hover:border-white/[0.06] hover:bg-white/[0.02]"
              )}
            >
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {teamA!.team_name}
              </p>
              {effectiveSelection === teamA!.id && (
                <p className="text-[10px] font-semibold text-orange-400 mt-1 uppercase tracking-wider">
                  Your Pick
                </p>
              )}
            </button>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] px-3 py-1.5">
                <Swords className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase">VS</span>
              </div>
              {predictionStatus === "calculated" && match.winner && (
                <p className="text-[10px] font-semibold text-green-400 mt-1">
                  Winner: {match.winner}
                </p>
              )}
            </div>

            <button
              onClick={() => !isDisabled && hasBothTeams && onSelect(match.id, teamB!.id)}
              disabled={isDisabled}
              className={cn(
                "group rounded-xl border p-3 sm:p-4 text-right transition-all duration-200",
                effectiveSelection === teamB!.id
                  ? "border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(255,122,0,0.1)]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                isDisabled && "cursor-default opacity-70 hover:border-white/[0.06] hover:bg-white/[0.02]"
              )}
            >
              <p className="text-sm sm:text-base font-bold text-white truncate">
                {teamB!.team_name}
              </p>
              {effectiveSelection === teamB!.id && (
                <p className="text-[10px] font-semibold text-orange-400 mt-1 uppercase tracking-wider">
                  Your Pick
                </p>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {match.match_date
                ? `${formatDate(match.match_date)} at ${formatTime(match.match_date)}`
                : "TBA"}
            </span>
          </div>
          {predictionStatus === "calculated" && userPrediction && (
            <span className={cn(
              "font-semibold",
              userPrediction.is_correct ? "text-green-400" : "text-red-400"
            )}>
              {userPrediction.is_correct ? (
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Correct</span>
              ) : (
                <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Wrong</span>
              )}
            </span>
          )}
          {predictionStatus === "locked" && userPrediction && (
            <span className="text-yellow-400 font-medium">Prediction submitted</span>
          )}
          {predictionStatus === "open" && (
            <span className="flex items-center gap-1 text-green-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Predict now
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
