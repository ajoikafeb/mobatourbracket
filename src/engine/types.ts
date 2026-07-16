export type MatchStatus = "waiting" | "upcoming" | "live" | "finished" | "cancelled";
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
  isEliminated: boolean;
}

export interface EngineMatch {
  id: string;
  round: RoundName;
  roundOrder: number;
  matchIndex: number;
  matchNumber: number;
  teamA: EngineTeam | null;
  teamB: EngineTeam | null;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId: string | null;
  loserId: string | null;
  scheduledTime: string | null;
  bestOf: number;
  nextMatchId: string | null;
  nextSlot: "A" | "B" | null;
}

export interface EngineRound {
  name: RoundName;
  order: number;
  matches: EngineMatch[];
}

export interface EngineBracket {
  teams: EngineTeam[];
  rounds: EngineRound[];
  matches: EngineMatch[];
  champion: EngineTeam | null;
  stats: EngineBracketStats;
  config: EngineBracketConfig;
}

export interface EngineBracketStats {
  totalMatches: number;
  completedMatches: number;
  liveMatches: number;
  waitingMatches: number;
  progress: number;
}

export interface EngineBracketConfig {
  bracketSize: number;
  totalByes: number;
  bestOf: number;
  seedingMode: SeedingMode;
}

import { ROUND_ORDER as _ROUND_ORDER } from "@/lib/types";
export type RoundName = import("@/lib/types").RoundName;
export const ROUND_ORDER: RoundName[] = _ROUND_ORDER;

export function getRoundName(bracketSize: number, roundIndex: number): RoundName {
  const totalRounds = Math.log2(bracketSize);
  const allRounds: RoundName[] = [
    "Round of 64",
    "Round of 32",
    "Round of 16",
    "Quarter Final",
    "Semi Final",
    "Grand Final",
  ];
  const startIdx = roundIndex + (allRounds.length - totalRounds);
  return allRounds[Math.max(0, Math.min(startIdx, allRounds.length - 1))] || "Grand Final";
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

export interface BracketValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
