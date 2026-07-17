"use client";

import { useState, useEffect, useCallback } from "react";
import type { Announcement } from "@/lib/types";
import { getAnnouncements, getPublishedAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/services/announcement-service";

export function useAnnouncements(publishedOnly = false) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = publishedOnly ? await getPublishedAnnouncements() : await getAnnouncements();
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [publishedOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  return { announcements, loading, refetch: fetch };
}

export { createAnnouncement, updateAnnouncement, deleteAnnouncement };
