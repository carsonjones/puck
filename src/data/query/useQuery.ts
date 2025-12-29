import { useEffect, useRef, useState } from "react";
import { queryClient, QueryState } from "./queryClient.js";

type UseQueryOptions = {
  staleTimeMs?: number;
  enabled?: boolean;
};

export const useQuery = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {}
): QueryState<T> => {
  const [state, setState] = useState<QueryState<T>>(() => queryClient.getState<T>(key));
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  const lastFetchedKeyRef = useRef<string | null>(null);
  fetcherRef.current = fetcher;
  optionsRef.current = options;

  useEffect(() => {
    const currentState = queryClient.getState<T>(key);
    setState(currentState);

    const unsubscribe = queryClient.subscribe(key, () => {
      setState(queryClient.getState<T>(key));
    });

    // Only fetch if enabled and we haven't fetched this key yet
    if (optionsRef.current.enabled !== false && lastFetchedKeyRef.current !== key) {
      lastFetchedKeyRef.current = key;
      queryClient.fetchQuery<T>(key, fetcherRef.current, optionsRef.current).catch(() => undefined);
    }

    return unsubscribe;
  }, [key]);

  return state;
};
