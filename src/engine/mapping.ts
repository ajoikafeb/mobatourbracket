import type { EngineTeam, EngineMatch } from "./types";
import type { Team, Match } from "@/lib/types";

export function mapTeamToDB(team: EngineTeam): Record<string, unknown> {
  const players = team.players.map((p) => p.username);
  return {
    team_name: team.name,
    logo: team.logo,
    captain: players[0] || "",
    player_1: players[0] || "",
    player_2: players[1] || "",
    player_3: players[2] || "",
    player_4: players[3] || "",
    player_5: players[4] || "",
    player_6: players[5] || "",
    substitute: players[6] || null,
    seed: team.seed,
  };
}

export function mapTeamFromDB(team: Team, isEliminated: boolean = false): EngineTeam {
  const players: { username: string; originalIndex: number }[] = [];
  const fields = [
    team.player_1,
    team.player_2,
    team.player_3,
    team.player_4,
    team.player_5,
    (team as Team & { player_6?: string }).player_6,
    team.substitute,
  ];
  for (const f of fields) {
    if (f) {
      players.push({ username: f, originalIndex: players.length });
    }
  }
  return {
    id: team.id,
    name: team.team_name,
    players,
    seed: team.seed,
    logo: team.logo,
    isEliminated,
  };
}

export function mapMatchToDB(match: EngineMatch): Record<string, unknown> {
  return {
    team_a: match.teamA?.name || "",
    team_a_id: match.teamA?.id || null,
    team_b: match.teamB?.name || "",
    team_b_id: match.teamB?.id || null,
    score_a: match.scoreA,
    score_b: match.scoreB,
    status: match.status === "upcoming" ? "waiting" : match.status,
    round: match.round,
    round_order: match.roundOrder,
    match_index: match.matchIndex,
    match_date: match.scheduledTime || new Date().toISOString(),
    best_of: match.bestOf,
    winner: match.winnerId
      ? match.teamA?.id === match.winnerId
        ? match.teamA?.name
        : match.teamB?.name
      : null,
    winner_id: match.winnerId,
    bracket_slot: match.matchIndex,
  };
}

export function mapMatchFromDB(match: Match): EngineMatch {
  return {
    id: match.id,
    round: match.round as EngineMatch["round"],
    roundOrder: match.round_order,
    matchIndex: match.match_index,
    matchNumber: match.match_index + 1,
    teamA: match.team_a
      ? {
          id: match.team_a_id || "",
          name: match.team_a,
          players: [],
          seed: 0,
          logo: null,
          isEliminated: match.winner_id != null && match.winner_id !== match.team_a_id,
        }
      : null,
    teamB: match.team_b
      ? {
          id: match.team_b_id || "",
          name: match.team_b,
          players: [],
          seed: 0,
          logo: null,
          isEliminated: match.winner_id != null && match.winner_id !== match.team_b_id,
        }
      : null,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status as EngineMatch["status"],
    winnerId: match.winner_id,
    loserId: null,
    scheduledTime: match.match_date,
    bestOf: match.best_of,
    nextMatchId: null,
    nextSlot: null,
  };
}
