"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bracket, BracketWithTeam, Team } from "@/lib/types";

export function useBrackets() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("brackets")
        .select("*")
        .order("position", { ascending: true });
      if (!cancelled) {
        setBrackets(data || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("brackets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brackets" },
        async () => {
          const { data } = await supabase
            .from("brackets")
            .select("*")
            .order("position", { ascending: true });
          setBrackets(data || []);
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
      .from("brackets")
      .select("*")
      .order("position", { ascending: true });
    setBrackets(data || []);
  };

  return { brackets, loading, refetch };
}

export function useBracketsWithTeams(teams: Team[]) {
  const { brackets, loading, refetch } = useBrackets();

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const bracketsWithTeams: BracketWithTeam[] = brackets.map((b) => ({
    ...b,
    team: b.team_id ? teamMap.get(b.team_id) || null : null,
  }));

  return { brackets: bracketsWithTeams, loading, refetch };
}
