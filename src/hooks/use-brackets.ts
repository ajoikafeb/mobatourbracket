"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bracket, BracketWithTeam, Team } from "@/lib/types";

export function useBrackets() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchBrackets() {
      try {
        const { data, error } = await supabase
          .from("brackets")
          .select("*")
          .order("position", { ascending: true });
        if (!cancelled) {
          setBrackets(error ? [] : data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setBrackets([]);
          setLoading(false);
        }
      }
    }

    fetchBrackets();

    try {
      const channel = supabase
        .channel("brackets-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "brackets" },
          () => fetchBrackets()
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
        .from("brackets")
        .select("*")
        .order("position", { ascending: true });
      setBrackets(error ? [] : data || []);
    } catch {
      setBrackets([]);
    }
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
