"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match } from "@/lib/types";

export function useMatches(filter?: "waiting" | "live" | "finished") {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let query = supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true });
      if (filter) {
        query = query.eq("status", filter);
      }
      const { data } = await query;
      if (!cancelled) {
        setMatches(data || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async () => {
          let q = supabase
            .from("matches")
            .select("*")
            .order("match_date", { ascending: true });
          if (filter) {
            q = q.eq("status", filter);
          }
          const { data } = await q;
          setMatches(data || []);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, filter]);

  const refetch = async () => {
    let query = supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });
    if (filter) {
      query = query.eq("status", filter);
    }
    const { data } = await query;
    setMatches(data || []);
  };

  return { matches, loading, refetch };
}

export function useCurrentMatch() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "live")
        .limit(1)
        .single();
      if (!cancelled) {
        setMatch(data);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("current-match-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async () => {
          const { data } = await supabase
            .from("matches")
            .select("*")
            .eq("status", "live")
            .limit(1)
            .single();
          setMatch(data);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { match, loading };
}

export function useNextMatch() {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "waiting")
        .gte("match_date", now)
        .order("match_date", { ascending: true })
        .limit(1)
        .single();
      if (!cancelled) {
        setMatch(data);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("next-match-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        async () => {
          const now = new Date().toISOString();
          const { data } = await supabase
            .from("matches")
            .select("*")
            .eq("status", "waiting")
            .gte("match_date", now)
            .order("match_date", { ascending: true })
            .limit(1)
            .single();
          setMatch(data);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { match, loading };
}
