import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/lib/types";

export async function getAnnouncements(publishedOnly = false): Promise<Announcement[]> {
  const supabase = createClient();
  let query = supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("announcements").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function createAnnouncement(announcement: Omit<Announcement, "id" | "created_at" | "updated_at">): Promise<Announcement> {
  const supabase = createClient();
  const { data, error } = await supabase.from("announcements").insert(announcement).select().single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
  const supabase = createClient();
  const { data, error } = await supabase.from("announcements").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("announcements")
    .select("*")
    .eq("published", true)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
