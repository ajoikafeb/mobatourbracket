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
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  status: "waiting" | "live" | "finished";
  round: string;
  match_date: string;
  best_of: number;
  winner: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bracket {
  id: string;
  round: string;
  position: number;
  team_name: string;
  team_seed: number;
  team_id: string | null;
  opponent_id: string | null;
  match_id: string | null;
  is_winner: boolean;
  is_current: boolean;
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
  footer_text: string;
  created_at: string;
  updated_at: string;
}

export type RoundName =
  | "Round of 16"
  | "Quarter Final"
  | "Semi Final"
  | "Grand Final"
  | "Champion";

export const ROUND_ORDER: RoundName[] = [
  "Round of 16",
  "Quarter Final",
  "Semi Final",
  "Grand Final",
  "Champion",
];

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
