"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event, EventCategoryItem } from "@/lib/types";
import { getEvents, getEventBySlug, getEventById, getEventCategories, getFeaturedEvents, getEventsByStatus, createEvent, updateEvent, deleteEvent, duplicateEvent } from "@/services/event-service";

export function useEvents(publishedOnly = false) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getEvents(publishedOnly);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [publishedOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, refetch: fetch };
}

export function useEvent(slug: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    getEventBySlug(slug).then((e) => { setEvent(e); setLoading(false); });
  }, [slug]);

  return { event, loading };
}

export function useEventById(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getEventById(id).then((e) => { setEvent(e); setLoading(false); });
  }, [id]);

  return { event, loading };
}

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventCategories().then((c) => { setCategories(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return { categories, loading };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeaturedEvents().then((e) => { setEvents(e); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return { events, loading };
}

export function useEventsByStatus(status: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!status) { setLoading(false); return; }
    getEventsByStatus(status).then((e) => { setEvents(e); setLoading(false); }).catch(() => setLoading(false));
  }, [status]);

  return { events, loading };
}

export { createEvent, updateEvent, deleteEvent, duplicateEvent };
