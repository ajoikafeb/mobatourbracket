"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("teams")
        .select("*")
        .order("team_name", { ascending: true });
      if (!cancelled) {
        setTeams(data || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("teams-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        async () => {
          const { data } = await supabase
            .from("teams")
            .select("*")
            .order("team_name", { ascending: true });
          setTeams(data || []);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const refetch = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("team_name", { ascending: true });
    setTeams(data || []);
  };

  return { teams, loading, refetch };
}
