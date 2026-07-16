import type { EngineMatch, EngineTeam } from "./types";

export interface AdvancementResult {
  updatedMatch: EngineMatch;
  updatedNextMatch: EngineMatch | null;
  eliminatedTeam: EngineTeam | null;
}

export function advanceWinner(
  matchId: string,
  winnerId: string,
  matches: EngineMatch[]
): AdvancementResult | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  const winnerTeam =
    match.teamA?.id === winnerId ? match.teamA : match.teamB;
  const loserTeam =
    match.teamA?.id === winnerId ? match.teamB : match.teamA;

  if (!winnerTeam) return null;

  match.winnerId = winnerId;
  match.loserId = loserTeam?.id || null;
  match.status = "finished";

  if (match.teamA && match.teamA.id !== winnerId) {
    match.teamA = { ...match.teamA, isEliminated: true };
  }
  if (match.teamB && match.teamB.id !== winnerId) {
    match.teamB = { ...match.teamB, isEliminated: true };
  }

  let updatedNextMatch: EngineMatch | null = null;

  if (match.nextMatchId) {
    const nextMatch = matches.find((m) => m.id === match.nextMatchId);
    if (nextMatch) {
      const winnerWithScore = { ...winnerTeam };
      if (match.nextSlot === "A") {
        nextMatch.teamA = winnerWithScore;
      } else {
        nextMatch.teamB = winnerWithScore;
      }
      updatedNextMatch = nextMatch;
    }
  }

  return {
    updatedMatch: match,
    updatedNextMatch,
    eliminatedTeam: loserTeam ? { ...loserTeam, isEliminated: true } : null,
  };
}

export function resetMatch(
  matchId: string,
  matches: EngineMatch[]
): EngineMatch | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  if (match.winnerId) {
    const loserId = match.loserId;
    if (loserId) {
      const loserMatches = matches.filter(
        (m) => m.status === "finished" && m.loserId === loserId
      );
      if (loserMatches.length === 1) {
        for (const m of matches) {
          if (m.teamA?.id === loserId) {
            m.teamA = { ...m.teamA, isEliminated: false };
          }
          if (m.teamB?.id === loserId) {
            m.teamB = { ...m.teamB, isEliminated: false };
          }
        }
      }
    }

    if (match.nextMatchId) {
      const nextMatch = matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        if (match.nextSlot === "A") {
          nextMatch.teamA = null;
        } else {
          nextMatch.teamB = null;
        }
      }
    }
  }

  match.winnerId = null;
  match.loserId = null;
  match.scoreA = 0;
  match.scoreB = 0;
  match.status = "waiting";

  return match;
}

export function resetRound(
  roundName: string,
  matches: EngineMatch[]
): void {
  const roundMatches = matches
    .filter((m) => m.round === roundName)
    .sort((a, b) => a.matchIndex - b.matchIndex);

  for (const match of roundMatches) {
    resetMatch(match.id, matches);
  }
}
