import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";

export async function updateTeam(
  id: string,
  updates: Partial<Pick<Team, "team_name" | "captain" | "player_1" | "player_2" | "player_3" | "player_4" | "player_5" | "substitute" | "logo">>
): Promise<Team> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teams")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
