export type MatchStatus = "waiting" | "live" | "finished";
export type SeedingMode = "random" | "manual" | "imported";

export interface EnginePlayer {
  username: string;
  originalIndex: number;
}

export interface EngineTeam {
  id: string;
  name: string;
  players: EnginePlayer[];
  seed: number;
  logo: string | null;
}

export interface EngineBracketSlot {
  id: string;
  round: RoundName;
  roundOrder: number;
  position: number;
  teamId: string | null;
  teamName: string;
  teamSeed: number;
  isBye: boolean;
  isWinner: boolean;
  matchId: string | null;
  nextSlotId: string | null;
}

export interface EngineMatch {
  id: string;
  round: RoundName;
  roundOrder: number;
  matchIndex: number;
  slotAId: string;
  slotBId: string;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId: string | null;
  winnerName: string | null;
  bestOf: number;
  bracketSlot: number;
  startTime: string | null;
  endTime: string | null;
}

export interface EngineBracket {
  slots: EngineBracketSlot[];
  matches: EngineMatch[];
  rounds: RoundName[];
  bracketSize: number;
  totalTeams: number;
  totalByes: number;
}

export type RoundName =
  | "Round of 64"
  | "Round of 32"
  | "Round of 16"
  | "Quarter Final"
  | "Semi Final"
  | "Grand Final"
  | "Champion";

export const ROUND_ORDER: RoundName[] = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarter Final",
  "Semi Final",
  "Grand Final",
  "Champion",
];

export interface TournamentConfig {
  playersPerTeam: number;
  bestOf: number;
  seedingMode: SeedingMode;
  manualSeeds?: Record<string, number>;
}

export interface ScheduleConfig {
  startDate: string;
  startTime: string;
  matchDurationMinutes: number;
  breakDurationMinutes: number;
  timezone: string;
}

export interface PlayerImportResult {
  players: EnginePlayer[];
  duplicates: { username: string; count: number; indices: number[] }[];
  totalImported: number;
  blankLinesRemoved: number;
}

export interface TeamGenerationResult {
  teams: EngineTeam[];
  remainingPlayers: EnginePlayer[];
  teamCount: number;
  assignedCount: number;
  remainingCount: number;
}

export interface TournamentValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  details?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  details?: string;
}
