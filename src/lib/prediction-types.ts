import type { Match, Team } from "@/lib/types";

export interface PredictionSettings {
  id: string;
  event_id: string;
  enabled: boolean;
  lock_minutes_before: number;
  leaderboard_enabled: boolean;
  points_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionUser {
  id: string;
  discord_username: string;
  total_predictions: number;
  correct_predictions: number;
  wrong_predictions: number;
  points: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface PredictionEntry {
  id: string;
  match_id: string;
  event_id: string;
  discord_username: string;
  selected_team_id: string;
  is_correct: boolean | null;
  submitted_at: string;
  created_at: string;
}

export type PredictionStatus = "open" | "locked" | "calculated" | "cancelled";

export interface PredictableMatch {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  predictionStatus: PredictionStatus;
  userPrediction: PredictionEntry | null;
}

export interface LeaderboardEntry {
  rank: number;
  discord_username: string;
  points: number;
  accuracy: number;
  correct_predictions: number;
  wrong_predictions: number;
  current_streak: number;
  best_streak: number;
}

export const PREDICTION_STATUS_CONFIG: Record<PredictionStatus, { label: string; color: string }> = {
  open: { label: "Prediction Open", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  locked: { label: "Prediction Locked", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  calculated: { label: "Result Available", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  cancelled: { label: "Cancelled", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
};
