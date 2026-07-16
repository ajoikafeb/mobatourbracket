"use client";

import { useMemo } from "react";
import type { EngineMatch, EngineBracket, RoundName } from "@/engine/types";
import { ROUND_ORDER, ROUND_CONFIG } from "@/lib/types";
import { MatchCard } from "./match-card";
import { ChampionDisplay } from "./champion-display";

interface BracketViewProps {
  bracket: EngineBracket;
  onMatchClick?: (match: EngineMatch) => void;
  hoveredTeamId?: string | null;
  onTeamHover?: (teamId: string | null) => void;
  isAdmin?: boolean;
}

const CARD_H = 56;
const GAP = 8;
const UNIT = CARD_H + GAP;

export function BracketView({
  bracket,
  onMatchClick,
  hoveredTeamId,
  onTeamHover,
  isAdmin,
}: BracketViewProps) {
  const activeRounds = useMemo(() => {
    const roundNames = new Set(bracket.matches.map((m) => m.round));
    return ROUND_ORDER.filter((name) => roundNames.has(name) && name !== "Champion");
  }, [bracket.matches]);

  const groupedByRound = useMemo(() => {
    const map = new Map<RoundName, EngineMatch[]>();
    for (const round of activeRounds) {
      map.set(
        round,
        bracket.matches
          .filter((m) => m.round === round)
          .sort((a, b) => a.matchIndex - b.matchIndex)
      );
    }
    return map;
  }, [bracket.matches, activeRounds]);

  const positions = useMemo(() => {
    const pos = new Map<string, number>();
    const firstRound = groupedByRound.get(activeRounds[0]) || [];
    firstRound.forEach((m, i) => {
      pos.set(m.id, i * UNIT);
    });
    for (let r = 1; r < activeRounds.length; r++) {
      const matches = groupedByRound.get(activeRounds[r]) || [];
      const prevMatches = groupedByRound.get(activeRounds[r - 1]) || [];
      matches.forEach((match, i) => {
        const f0 = prevMatches[i * 2];
        const f1 = prevMatches[i * 2 + 1];
        const p0 = f0 ? (pos.get(f0.id) ?? 0) : 0;
        const p1 = f1 ? (pos.get(f1.id) ?? 0) : p0;
        pos.set(match.id, (p0 + p1) / 2);
      });
    }
    return pos;
  }, [groupedByRound, activeRounds]);

  const firstRoundCount = groupedByRound.get(activeRounds[0])?.length || 1;
  const minHeight = firstRoundCount * UNIT + 40;

  return (
    <div className="overflow-x-auto pb-6 -mx-4 px-4 bracket-scroll">
      <div
        className="flex items-start gap-0 min-w-fit"
        style={{ minHeight }}
      >
        {activeRounds.map((roundName, roundIdx) => {
          const matches = groupedByRound.get(roundName) || [];
          const isFinal = roundName === "Grand Final";
          const config = ROUND_CONFIG[roundName];

          return (
            <div key={roundName} className="contents">
              {roundIdx > 0 && (
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 32, alignSelf: "stretch" }}
                >
                  <svg width="32" height="100%" className="text-white/10">
                    <line
                      x1="0"
                      y1="50%"
                      x2="32"
                      y2="50%"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              )}

              <div
                className="flex flex-col flex-shrink-0"
                style={{ width: isFinal ? 220 : 240 }}
              >
                <div className="text-center mb-3 px-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 sm:text-xs">
                    {config?.shortLabel || roundName}
                  </span>
                </div>

                {matches.map((match, i) => {
                  const y = positions.get(match.id) ?? i * UNIT;
                  const prevBottom =
                    i === 0 ? 0 : (positions.get(matches[i - 1].id) ?? 0) + CARD_H;
                  const marginTop = y - prevBottom;

                  return (
                    <div
                      key={match.id}
                      style={{ marginTop: i === 0 ? y : marginTop }}
                    >
                      <MatchCard
                        match={match}
                        onClick={() => onMatchClick?.(match)}
                        hoveredTeamId={hoveredTeamId}
                        onTeamHover={onTeamHover}
                        isAdmin={isAdmin}
                        isFinal={isFinal}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {bracket.champion && (
          <div className="contents">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: 32, alignSelf: "stretch" }}
            >
              <svg width="32" height="100%" className="text-amber-500/30">
                <line
                  x1="0"
                  y1="50%"
                  x2="32"
                  y2="50%"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <ChampionDisplay team={bracket.champion} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .bracket-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .bracket-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 3px;
        }
        .bracket-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
        }
        .bracket-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
