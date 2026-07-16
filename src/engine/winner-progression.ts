import type { EngineMatch, EngineBracketSlot } from "./types";

export interface WinnerProgressionResult {
  updatedMatch: EngineMatch;
  updatedNextMatch: EngineMatch | null;
  updatedSlot: EngineBracketSlot;
  updatedNextSlot: EngineBracketSlot | null;
}

export function advanceWinner(
  matchId: string,
  winnerId: string,
  winnerName: string,
  matches: EngineMatch[],
  slots: EngineBracketSlot[]
): WinnerProgressionResult | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.winnerId = winnerId;
  match.winnerName = winnerName;
  match.status = "finished";

  const winnerSlotId =
    match.teamAId === winnerId ? match.slotAId : match.slotBId;
  const winnerSlot = slots.find((s) => s.id === winnerSlotId);
  if (!winnerSlot) return null;

  winnerSlot.isWinner = true;

  const nextSlotId = winnerSlot.nextSlotId;
  const nextSlot = nextSlotId ? slots.find((s) => s.id === nextSlotId) : null;

  let updatedNextMatch: EngineMatch | null = null;

  if (nextSlot) {
    nextSlot.teamId = winnerId;
    nextSlot.teamName = winnerName;
    nextSlot.teamSeed = winnerSlot.teamSeed;

    if (nextSlot.matchId) {
      const nextMatch = matches.find((m) => m.id === nextSlot.matchId);
      if (nextMatch) {
        if (nextSlot.id === nextMatch.slotAId) {
          nextMatch.teamAId = winnerId;
          nextMatch.teamAName = winnerName;
        } else {
          nextMatch.teamBId = winnerId;
          nextMatch.teamBName = winnerName;
        }
        updatedNextMatch = nextMatch;
      }
    }
  }

  return {
    updatedMatch: match,
    updatedNextMatch,
    updatedSlot: winnerSlot,
    updatedNextSlot: nextSlot ?? null,
  };
}
