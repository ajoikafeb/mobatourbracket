"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    getUser();

    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (_event: string, session: { user: User } | null) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );
      return () => subscription.unsubscribe();
    } catch {
      setLoading(false);
      return () => {};
    }
  }, []);

  return { user, loading };
}
