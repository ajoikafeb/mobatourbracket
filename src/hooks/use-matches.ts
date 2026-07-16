"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/types";

export function useMatches(filter?: "waiting" | "live" | "finished") {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchMatches() {
      try {
        let query = supabase
          .from("matches")
          .select("*")
          .order("match_date", { ascending: true });
        if (filter) {
          query = query.eq("status", filter);
        }
        const { data, error } = await query;
        if (!cancelled) {
          setMatches(error ? [] : data || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setMatches([]);
          setLoading(false);
        }
      }
    }

    fetchMatches();

    try {
      const channel = supabase
        .channel("matches-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => fetchMatches()
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
  }, [filter]);

  const refetch = async () => {
    try {
      const supabase = createClient();
      let query = supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true });
      if (filter) {
        query = query.eq("status", filter);
      }
      const { data, error } = await query;
      setMatches(error ? [] : data || []);
    } catch {
      setMatches([]);
    }
  };

  return { matches, loading, refetch };
}

export function useCurrentMatch() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchCurrentMatch() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .eq("status", "live")
          .limit(1)
          .single();
        if (!cancelled) {
          setMatch(error ? null : data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setMatch(null);
          setLoading(false);
        }
      }
    }

    fetchCurrentMatch();

    try {
      const channel = supabase
        .channel("current-match-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => fetchCurrentMatch()
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

  return { match, loading };
}

export function useNextMatch() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchNextMatch() {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .eq("status", "waiting")
          .gte("match_date", now)
          .order("match_date", { ascending: true })
          .limit(1)
          .single();
        if (!cancelled) {
          setMatch(error ? null : data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setMatch(null);
          setLoading(false);
        }
      }
    }

    fetchNextMatch();

    try {
      const channel = supabase
        .channel("next-match-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => fetchNextMatch()
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

  return { match, loading };
}
