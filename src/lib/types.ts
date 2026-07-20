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
  player_6: string;
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

export type TournamentState = "draft" | "ready" | "running" | "completed";

export interface Settings {
  id: string;
  tournament_name: string;
  tournament_subtitle: string;
  tournament_logo: string | null;
  tournament_banner: string | null;
  tournament_status: "upcoming" | "ongoing" | "completed";
  tournament_state?: TournamentState;
  current_round_order?: number;
  current_match_id?: string | null;
  tournament_start_date: string | null;
  match_duration_minutes: number;
  break_duration_minutes: number;
  timezone: string;
  best_of: number;
  players_per_team: number;
  footer_text: string;
  community_name?: string;
  primary_color?: string;
  secondary_color?: string;
  hero_banner?: string | null;
  discord_url?: string;
  kick_url?: string;
  instagram_url?: string;
  website_url?: string;
  version?: string;
  created_at: string;
  updated_at: string;
}

// ── v0.0.2: Event Platform Types ────────────────────────

export type EventCategory =
  | "tournament"
  | "giveaway"
  | "community_night"
  | "poker"
  | "quiz"
  | "watch_party"
  | "workshop"
  | "custom";

export type EventStatus =
  | "draft"
  | "registration_open"
  | "registration_closed"
  | "upcoming"
  | "running"
  | "completed"
  | "cancelled";

export type RegistrationStatus = "open" | "closed" | "invite_only";

export interface EventCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  thumbnail: string | null;
  description: string;
  category: EventCategory;
  status: EventStatus;
  registration_status: RegistrationStatus;
  start_date: string | null;
  end_date: string | null;
  location: string;
  max_participants: number;
  current_participants: number;
  featured: boolean;
  published: boolean;
  prediction_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type FieldType =
  | "text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "textarea"
  | "date"
  | "upload"
  | "discord"
  | "telegram"
  | "kick_username"
  | "ml_id"
  | "server_id"
  | "custom";

export interface RegistrationForm {
  id: string;
  event_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistrationField {
  id: string;
  form_id: string;
  field_type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
  validation: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export type RegistrationResponseStatus = "pending" | "approved" | "rejected";

export interface RegistrationResponse {
  id: string;
  event_id: string;
  form_id: string;
  respondent_name: string;
  respondent_email: string;
  data: Record<string, unknown>;
  status: RegistrationResponseStatus;
  notes: string;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
}

export type AnnouncementType = "info" | "warning" | "success" | "event" | "update";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  pinned: boolean;
  published: boolean;
  event_id: string | null;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_CATEGORY_MAP: Record<EventCategory, string> = {
  tournament: "Tournament",
  giveaway: "Giveaway",
  community_night: "Community Night",
  poker: "Poker",
  quiz: "Quiz",
  watch_party: "Watch Party",
  workshop: "Workshop",
  custom: "Custom Event",
};

export const EVENT_STATUS_MAP: Record<EventStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
  registration_open: { label: "Registration Open", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  registration_closed: { label: "Registration Closed", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  upcoming: { label: "Upcoming", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  running: { label: "Running", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
};

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
