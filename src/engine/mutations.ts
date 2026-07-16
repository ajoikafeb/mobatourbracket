import type { EngineMatch, EngineTeam } from "./types";

export function swapTeams(matchId: string, matches: EngineMatch[]): EngineMatch | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;
  if (match.status === "finished") return null;

  const tempTeam = match.teamA;
  match.teamA = match.teamB;
  match.teamB = tempTeam;

  const tempScore = match.scoreA;
  match.scoreA = match.scoreB;
  match.scoreB = tempScore;

  return match;
}

export function replaceTeam(
  matchId: string,
  slot: "A" | "B",
  newTeam: EngineTeam | null,
  matches: EngineMatch[]
): EngineMatch | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  if (slot === "A") {
    match.teamA = newTeam ? { ...newTeam } : null;
  } else {
    match.teamB = newTeam ? { ...newTeam } : null;
  }

  return match;
}

export function deleteTeamFromMatch(
  matchId: string,
  slot: "A" | "B",
  matches: EngineMatch[]
): EngineMatch | null {
  return replaceTeam(matchId, slot, null, matches);
}

export function updateMatchScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  matches: EngineMatch[]
): EngineMatch | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;

  return match;
}

export function updateMatchStatus(
  matchId: string,
  status: EngineMatch["status"],
  matches: EngineMatch[]
): EngineMatch | null {
  const match = matches.find((m) => m.id === matchId);
  if (!match) return null;

  match.status = status;
  return match;
}

export function resetEntireBracket(matches: EngineMatch[]): void {
  for (const match of matches) {
    match.winnerId = null;
    match.loserId = null;
    match.scoreA = 0;
    match.scoreB = 0;
    match.status = "waiting";

    const firstRound = matches.filter(
      (m) => m.roundOrder === 0
    );
    if (firstRound.some((m) => m.id === match.id)) continue;

    if (match.roundOrder > 0) {
      match.teamA = null;
      match.teamB = null;
    }
  }
}
