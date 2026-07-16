"use client";

import { createBrowserClient } from "@supabase/ssr";

interface EmptyResult {
  data: unknown;
  error: null;
}

type EmptyPromise = Promise<EmptyResult>;

interface EmptyTableProxy {
  select: () => EmptyChainProxy;
  insert: () => EmptyChainProxy;
  update: () => EmptyChainProxy;
  delete: () => EmptyChainProxy;
  upsert: () => EmptyPromise;
  eq: () => EmptyChainProxy;
  neq: () => EmptyChainProxy;
  gte: () => EmptyChainProxy;
  not: () => EmptyChainProxy;
  order: () => EmptyChainProxy;
  limit: () => EmptyChainProxy;
  single: () => EmptyPromise;
  then: undefined;
  [key: string]: (() => EmptyChainProxy) | (() => EmptyPromise) | undefined;
}

interface EmptyChainProxy {
  select: EmptyChainProxy;
  insert: EmptyChainProxy;
  update: EmptyChainProxy;
  delete: EmptyChainProxy;
  eq: EmptyChainProxy;
  neq: EmptyChainProxy;
  gte: EmptyChainProxy;
  not: EmptyChainProxy;
  order: EmptyChainProxy;
  limit: EmptyChainProxy;
  single: EmptyPromise;
  then: undefined;
  [key: string]: EmptyChainProxy | EmptyPromise | undefined;
}

interface EmptyChannelProxy {
  on: EmptyChannelProxy;
  subscribe: EmptyPromise;
  then: undefined;
  [key: string]: EmptyChannelProxy | EmptyPromise | undefined;
}

interface EmptyClientProxy {
  from: (table: string) => EmptyTableProxy;
  auth: {
    getUser: () => EmptyPromise;
    signInWithPassword: () => EmptyPromise;
    signOut: () => EmptyPromise;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
  };
  channel: (name: string) => EmptyChannelProxy;
  removeChannel: () => void;
  then: undefined;
}

const noop = () => {};

const noopResolve = (data: unknown = null): EmptyPromise =>
  Promise.resolve({ data, error: null });

const chainProxy: ProxyHandler<EmptyChainProxy> = {
  get(_, prop) {
    if (prop === "then") return undefined;
    return new Proxy(noop as unknown as EmptyChainProxy, chainProxy);
  },
};

function getEmptyClient(): EmptyClientProxy {
  return {
    from: () =>
      new Proxy({} as EmptyTableProxy, {
        get: (_, method) => {
          if (method === "then") return undefined;
          if (method === "upsert") return noopResolve([]);
          return new Proxy(noop as unknown as EmptyChainProxy, chainProxy);
        },
      }),
    auth: {
      getUser: () => noopResolve({ user: null }),
      signInWithPassword: () => noopResolve({ user: null }),
      signOut: () => noopResolve(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: noop } },
      }),
    },
    channel: () =>
      new Proxy({} as EmptyChannelProxy, {
        get: () => new Proxy(noop as unknown as EmptyChainProxy, chainProxy),
      }),
    removeChannel: noop,
    then: undefined,
  };
}

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") return getEmptyClient();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !url ||
    !key ||
    url === "your-supabase-url" ||
    key === "your-supabase-anon-key"
  ) {
    return getEmptyClient();
  }

  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}
