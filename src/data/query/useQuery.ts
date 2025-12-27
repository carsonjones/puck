import { useEffect, useState } from "react";
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

  useEffect(() => {
    setState(queryClient.getState<T>(key));
    const unsubscribe = queryClient.subscribe(key, () => {
      setState(queryClient.getState<T>(key));
    });

    if (options.enabled !== false) {
      queryClient.fetchQuery<T>(key, fetcher, options).catch(() => undefined);
    }

    return unsubscribe;
  }, [key, options.enabled, options.staleTimeMs, fetcher]);

  return state;
};
