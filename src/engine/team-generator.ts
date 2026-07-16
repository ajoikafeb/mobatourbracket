import type { EnginePlayer, EngineTeam, TeamGenerationResult } from "./types";
import { generateId } from "./utils";

export function generateTeams(
  players: EnginePlayer[],
  playersPerTeam: number
): TeamGenerationResult {
  const teams: EngineTeam[] = [];
  const teamCount = Math.floor(players.length / playersPerTeam);

  for (let i = 0; i < teamCount; i++) {
    const start = i * playersPerTeam;
    const end = start + playersPerTeam;
    const teamPlayers = players.slice(start, end);

    teams.push({
      id: generateId(),
      name: `Team ${i + 1}`,
      players: teamPlayers,
      seed: i + 1,
      logo: null,
      isEliminated: false,
    });
  }

  const assignedCount = teamCount * playersPerTeam;
  const remainingPlayers = players.slice(assignedCount);

  return {
    teams,
    remainingPlayers,
    teamCount: teams.length,
    assignedCount,
    remainingCount: remainingPlayers.length,
  };
}
