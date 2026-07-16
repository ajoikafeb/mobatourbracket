export type {
  EnginePlayer,
  EngineTeam,
  EngineMatch,
  EngineRound,
  EngineBracket,
  EngineBracketStats,
  EngineBracketConfig,
  MatchStatus,
  SeedingMode,
  RoundName,
  TournamentConfig,
  ScheduleConfig,
  PlayerImportResult,
  TeamGenerationResult,
  TournamentValidation,
  ValidationError,
  ValidationWarning,
  BracketValidation,
} from "./types";

export { ROUND_ORDER, getRoundName } from "./types";

export { generateId } from "./utils";
export { parsePlayers } from "./player-parser";
export { generateTeams } from "./team-generator";
export { generateSeedOrder, applySeeding } from "./seeding";
export {
  determineBracketSize,
  generateBracket,
  computeStats,
} from "./bracket-engine";
export { generateSchedule } from "./schedule-generator";
export { advanceWinner, resetMatch, resetRound } from "./advancement";
export type { AdvancementResult } from "./advancement";
export {
  swapTeams,
  replaceTeam,
  deleteTeamFromMatch,
  updateMatchScore,
  updateMatchStatus,
  resetEntireBracket,
} from "./mutations";
export { validateTournament } from "./validation";
export { HistoryManager } from "./history";
export type { HistoryEntry } from "./history";
export { useUnloadWarning, useAutoSave } from "./autosave";
export {
  mapTeamToDB,
  mapTeamFromDB,
  mapMatchToDB,
  mapMatchFromDB,
} from "./mapping";

export {
  buildTournamentSnapshot,
  reconstructBracketFromDB,
  getBracketSize,
  getTotalRounds,
  getCurrentRoundName,
  getRoundMatches,
  getRoundProgress,
  isRoundComplete,
  canProceedToNextRound,
  canFinishTournament,
  getCurrentMatchFromSettings,
  findChampion,
  findPlacements,
  startTournament,
  finishTournament,
  setCurrentMatchId,
  saveMatchResult,
  resetMatchResult,
  resetAllMatches,
} from "./tournament-service";

export type { TournamentSnapshot, RoundProgress } from "./tournament-service";
