import type {
  EngineTeam,
  TournamentConfig,
  TournamentValidation,
  ValidationError,
  ValidationWarning,
} from "./types";

export function validateTournament(params: {
  teams: EngineTeam[];
  config: TournamentConfig;
}): TournamentValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (params.teams.length < 2) {
    errors.push({
      type: "INSUFFICIENT_TEAMS",
      message: "At least 2 teams are required to generate a tournament.",
    });
  }

  if (params.teams.length > 64) {
    errors.push({
      type: "TOO_MANY_TEAMS",
      message: "Maximum 64 teams supported.",
    });
  }

  const emptyTeams = params.teams.filter((t) => t.players.length === 0);
  if (emptyTeams.length > 0) {
    errors.push({
      type: "EMPTY_TEAMS",
      message: `${emptyTeams.length} team(s) have no players.`,
      details: emptyTeams.map((t) => t.name).join(", "),
    });
  }

  const underpopulated = params.teams.filter(
    (t) => t.players.length > 0 && t.players.length < params.config.playersPerTeam
  );
  if (underpopulated.length > 0) {
    warnings.push({
      type: "UNDERPOPULATED_TEAMS",
      message: `${underpopulated.length} team(s) have fewer than ${params.config.playersPerTeam} players.`,
      details: underpopulated
        .map((t) => `${t.name} (${t.players.length} players)`)
        .join(", "),
    });
  }

  const nameCounts = new Map<string, number>();
  for (const team of params.teams) {
    const name = team.name.toLowerCase().trim();
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }
  const duplicates = Array.from(nameCounts.entries()).filter(
    ([_, count]) => count > 1
  );
  if (duplicates.length > 0) {
    errors.push({
      type: "DUPLICATE_TEAM_NAMES",
      message: "Team names must be unique.",
      details: duplicates
        .map(([name, count]) => `"${name}" appears ${count} times`)
        .join(", "),
    });
  }

  const emptyNames = params.teams.filter(
    (t) => !t.name || t.name.trim() === ""
  );
  if (emptyNames.length > 0) {
    errors.push({
      type: "EMPTY_TEAM_NAMES",
      message: "All teams must have a name.",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
