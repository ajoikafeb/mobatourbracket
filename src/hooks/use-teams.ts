"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchTeams() {
      try {
        const { data, error } = await supabase
          .from("teams")
          .select("*")
          .order("team_name", { ascending: true });
        if (!cancelled) {
          setTeams(error ? [] : data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setTeams([]);
          setLoading(false);
        }
      }
    }

    fetchTeams();

    try {
      const channel = supabase
        .channel("teams-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "teams" },
          () => fetchTeams()
        )
        .subscribe();
      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    } catch {
      return () => { cancelled = true; };
    }
  }, []);

  const refetch = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("team_name", { ascending: true });
      setTeams(error ? [] : data || []);
    } catch {
      setTeams([]);
    }
  };

  return { teams, loading, refetch };
}
