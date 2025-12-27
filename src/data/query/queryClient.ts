type Status = "idle" | "loading" | "success" | "error";

export type QueryState<T> = {
  status: Status;
  data?: T;
  error?: unknown;
  updatedAt?: number;
};

type Listener = () => void;

type FetchOptions = {
  staleTimeMs?: number;
  enabled?: boolean;
};

class QueryClient {
  private cache = new Map<string, QueryState<unknown>>();
  private listeners = new Map<string, Set<Listener>>();

  subscribe(key: string, listener: Listener): () => void {
    const existing = this.listeners.get(key) ?? new Set<Listener>();
    existing.add(listener);
    this.listeners.set(key, existing);

    return () => {
      const set = this.listeners.get(key);
      if (!set) return;
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(key);
    };
  }

  private notify(key: string) {
    const set = this.listeners.get(key);
    if (!set) return;
    for (const listener of set) listener();
  }

  getState<T>(key: string): QueryState<T> {
    return (this.cache.get(key) as QueryState<T>) ?? { status: "idle" };
  }

  async fetchQuery<T>(key: string, fetcher: () => Promise<T>, options: FetchOptions = {}): Promise<T> {
    const { staleTimeMs = 0, enabled = true } = options;
    if (!enabled) throw new Error("Query disabled");

    const existing = this.getState<T>(key);
    const now = Date.now();
    const isFresh =
      existing.status === "success" &&
      typeof existing.updatedAt === "number" &&
      now - existing.updatedAt < staleTimeMs;

    if (isFresh && existing.data !== undefined) {
      return existing.data;
    }

    // Simple behavior: refetch on stale and update the cache before returning.
    this.cache.set(key, {
      status: "loading",
      data: existing.data,
      updatedAt: existing.updatedAt,
      error: undefined,
    });
    this.notify(key);

    try {
      const data = await fetcher();
      this.cache.set(key, { status: "success", data, updatedAt: Date.now() });
      this.notify(key);
      return data;
    } catch (error) {
      this.cache.set(key, {
        status: "error",
        data: existing.data,
        error,
        updatedAt: existing.updatedAt,
      });
      this.notify(key);
      throw error;
    }
  }

  prefetchQuery<T>(key: string, fetcher: () => Promise<T>, options: FetchOptions = {}): void {
    this.fetchQuery<T>(key, fetcher, options).catch(() => undefined);
  }

  invalidate(prefixOrKey: string): void {
    for (const key of this.cache.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        this.cache.delete(key);
        this.notify(key);
      }
    }
  }
}

export const queryClient = new QueryClient();
