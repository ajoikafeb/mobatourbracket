"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (!cancelled) {
          setSettings(error ? null : data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSettings(null);
          setLoading(false);
        }
      }
    }

    fetchSettings();

    try {
      const channel = supabase
        .channel("settings-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "settings" },
          () => fetchSettings()
        )
        .subscribe();
      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        cancelled = true;
      };
    }
  }, []);

  return { settings, loading };
}
