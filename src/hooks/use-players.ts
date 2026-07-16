"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchPlayers() {
      try {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .order("position", { ascending: true });
        if (!cancelled) {
          setPlayers(error ? [] : data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlayers([]);
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    try {
      const channel = supabase
        .channel("players-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "players" },
          () => fetchPlayers()
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

  const refetch = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("position", { ascending: true });
      setPlayers(error ? [] : data || []);
    } catch {
      setPlayers([]);
    }
  };

  return { players, loading, refetch };
}
