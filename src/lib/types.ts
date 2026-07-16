export interface Player {
  id: string;
  username: string;
  team_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  team_name: string;
  logo: string | null;
  captain: string;
  player_1: string;
  player_2: string;
  player_3: string;
  player_4: string;
  player_5: string;
  substitute: string | null;
  seed: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  team_a: string;
  team_a_id: string | null;
  team_b: string;
  team_b_id: string | null;
  score_a: number;
  score_b: number;
  status: "waiting" | "live" | "finished";
  round: string;
  round_order: number;
  match_index: number;
  match_date: string;
  best_of: number;
  winner: string | null;
  winner_id: string | null;
  bracket_slot: number | null;
  created_at: string;
  updated_at: string;
}

export interface Bracket {
  id: string;
  round: string;
  round_order: number;
  position: number;
  team_name: string;
  team_seed: number;
  team_id: string | null;
  opponent_id: string | null;
  match_id: string | null;
  is_winner: boolean;
  is_current: boolean;
  is_bye: boolean;
  created_at: string;
  updated_at: string;
}

export interface BracketWithTeam extends Bracket {
  team: Team | null;
}

export interface Settings {
  id: string;
  tournament_name: string;
  tournament_subtitle: string;
  tournament_logo: string | null;
  tournament_banner: string | null;
  tournament_status: "upcoming" | "ongoing" | "completed";
  tournament_start_date: string | null;
  match_duration_minutes: number;
  break_duration_minutes: number;
  timezone: string;
  best_of: number;
  players_per_team: number;
  footer_text: string;
  created_at: string;
  updated_at: string;
}

export type RoundName =
  | "Grand Final"
  | "Semi Final"
  | "Quarter Final"
  | "Round of 16"
  | "Round of 32"
  | "Round of 64"
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

export const ROUND_CONFIG: Record<string, { label: string; shortLabel: string }> = {
  "Round of 64": { label: "Round of 64", shortLabel: "R64" },
  "Round of 32": { label: "Round of 32", shortLabel: "R32" },
  "Round of 16": { label: "Round of 16", shortLabel: "R16" },
  "Quarter Final": { label: "Quarter Final", shortLabel: "QF" },
  "Semi Final": { label: "Semi Final", shortLabel: "SF" },
  "Grand Final": { label: "Grand Final", shortLabel: "GF" },
  Champion: { label: "Champion", shortLabel: "Winner" },
};

export const STATUS_COLORS = {
  waiting: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  live: "bg-red-500/20 text-red-400 border-red-500/30",
  finished: "bg-green-500/20 text-green-400 border-green-500/30",
} as const;

export const STATUS_DOT_COLORS = {
  waiting: "bg-zinc-400",
  live: "bg-red-500",
  finished: "bg-green-500",
} as const;
