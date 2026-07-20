"use client";

import { createBrowserClient } from "@supabase/ssr";

const ok = (data: unknown = null) => Promise.resolve({ data, error: null });

function buildChainProxy(): Record<string, unknown> {
  const proxy: Record<string, unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gte",
    "lte",
    "gt",
    "lt",
    "not",
    "in",
    "or",
    "like",
    "ilike",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "csv",
    "throwOnError",
  ];

  for (const m of methods) {
    if (m === "single" || m === "maybeSingle" || m === "csv" || m === "throwOnError") {
      proxy[m] = () => ok(null);
    } else {
      proxy[m] = () => proxy;
    }
  }

  return proxy;
}

function buildEmptyClient() {
  return {
    from: () => buildChainProxy(),
    auth: {
      getUser: () => ok({ user: null }),
      signInWithPassword: () => ok({ user: null }),
      signOut: () => ok(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  };
}

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") return buildEmptyClient();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !url ||
      !key ||
      url === "your-supabase-url" ||
      key === "your-supabase-anon-key"
    ) {
      return buildEmptyClient();
    }

    if (!_client) {
      _client = createBrowserClient(url, key);
      console.log("[Supabase] Browser client created for:", url);
    }
    return _client;
  } catch {
    return buildEmptyClient();
  }
}
