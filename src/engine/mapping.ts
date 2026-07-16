import type { EngineTeam, EngineMatch, EngineBracketSlot } from "./types";
import type { Team, Match, Bracket } from "@/lib/types";

export function mapTeamToDB(team: EngineTeam): Record<string, unknown> {
  const players = team.players.map((p) => p.username);
  return {
    id: team.id,
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

export function mapTeamFromDB(team: Team): EngineTeam {
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
  };
}

export function mapMatchToDB(match: EngineMatch): Record<string, unknown> {
  return {
    id: match.id,
    team_a: match.teamAName,
    team_b: match.teamBName,
    team_a_id: match.teamAId,
    team_b_id: match.teamBId,
    score_a: match.scoreA,
    score_b: match.scoreB,
    status: match.status,
    round: match.round,
    round_order: match.roundOrder,
    match_index: match.matchIndex,
    match_date: match.startTime || new Date().toISOString(),
    best_of: match.bestOf,
    winner: match.winnerName,
    winner_id: match.winnerId,
    bracket_slot: match.bracketSlot,
  };
}

export function mapMatchFromDB(match: Match): EngineMatch {
  return {
    id: match.id,
    round: match.round as EngineMatch["round"],
    roundOrder: match.round_order,
    matchIndex: match.match_index,
    slotAId: "",
    slotBId: "",
    teamAId: match.team_a_id,
    teamBId: match.team_b_id,
    teamAName: match.team_a,
    teamBName: match.team_b,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    winnerId: match.winner_id,
    winnerName: match.winner,
    bestOf: match.best_of,
    bracketSlot: match.bracket_slot ?? match.match_index,
    startTime: match.match_date,
    endTime: null,
  };
}

export function mapBracketToDB(
  slot: EngineBracketSlot
): Record<string, unknown> {
  return {
    round: slot.round,
    round_order: slot.roundOrder,
    position: slot.position,
    team_name: slot.teamName,
    team_seed: slot.teamSeed,
    team_id: slot.teamId || null,
    is_bye: slot.isBye,
    is_winner: slot.isWinner || false,
    is_current: false,
    match_id: null,
  };
}
