import { createClient } from "@/lib/supabase/client";
import type { Event, EventCategoryItem } from "@/lib/types";

export async function getEvents(publishedOnly = false): Promise<Event[]> {
  const supabase = createClient();
  let query = supabase.from("events").select("*").order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).single();
  if (error) return null;
  return data;
}

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function createEvent(event: Omit<Event, "id" | "created_at" | "updated_at" | "current_participants">): Promise<Event> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").insert(event).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateEvent(id: string): Promise<Event> {
  const original = await getEventById(id);
  if (!original) throw new Error("Event not found");
  const { id: _id, created_at, updated_at, ...rest } = original;
  const newEvent = await createEvent({
    ...rest,
    title: `${rest.title} (Copy)`,
    slug: `${rest.slug}-copy-${Date.now()}`,
    status: "draft",
    published: false,
    featured: false,
  });
  return newEvent;
}

export async function getEventCategories(): Promise<EventCategoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("event_categories").select("*").order("sort_order");
  if (error) throw error;
  return data || [];
}

export async function getFeaturedEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").eq("featured", true).eq("published", true).order("start_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getEventsByStatus(status: string): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("events").select("*").eq("status", status).eq("published", true).order("start_date", { ascending: true });
  if (error) throw error;
  return data || [];
}
