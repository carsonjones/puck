type Status = 'idle' | 'loading' | 'success' | 'error';

export type QueryState<T> = {
  status: Status;
  data?: T;
  error?: unknown;
  updatedAt?: number;
  isStale?: boolean;
};

type Listener = () => void;

type FetchOptions = {
  staleTimeMs?: number;
  enabled?: boolean;
};

const IDLE_STATE: QueryState<never> = { status: 'idle' };

// Deep equality check for data comparison
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // One is array, other isn't
  if (Array.isArray(a) || Array.isArray(b)) return false;

  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];
    if (!deepEqual(aVal, bVal)) return false;
  }

  return true;
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
    return (this.cache.get(key) as QueryState<T>) ?? IDLE_STATE;
  }

  async fetchQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchOptions = {},
  ): Promise<T> {
    const { staleTimeMs = 0, enabled = true } = options;
    if (!enabled) throw new Error('Query disabled');

    const existing = this.cache.get(key) as QueryState<T> | undefined;
    const now = Date.now();
    const isFresh =
      existing?.status === 'success' &&
      !existing.isStale &&
      typeof existing.updatedAt === 'number' &&
      now - existing.updatedAt < staleTimeMs;

    if (isFresh && existing?.data !== undefined) {
      return existing.data;
    }

    // Keep existing data during loading for seamless updates
    const existingData = existing?.data;
    const existingUpdatedAt = existing?.updatedAt;

    // Only notify loading if no existing data (first load)
    if (!existingData) {
      this.cache.set(key, {
        status: 'loading',
        data: undefined,
        updatedAt: existingUpdatedAt,
        error: undefined,
      });
      this.notify(key);
    }

    try {
      const data = await fetcher();
      const wasStale = existing?.isStale;
      const dataChanged = !deepEqual(existingData, data);

      this.cache.set(key, {
        status: 'success',
        data: dataChanged ? data : existingData,
        updatedAt: Date.now(),
      });

      // Notify if data changed OR was stale (so component clears isStale)
      if (dataChanged || wasStale) {
        this.notify(key);
      }

      return data;
    } catch (error) {
      this.cache.set(key, {
        status: 'error',
        data: existingData,
        error,
        updatedAt: existingUpdatedAt,
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
        const entry = this.cache.get(key);
        if (entry) {
          // Mark as stale instead of deleting - keeps data for comparison
          this.cache.set(key, { ...entry, isStale: true });
          this.notify(key);
        }
      }
    }
  }
}

export const queryClient = new QueryClient();
