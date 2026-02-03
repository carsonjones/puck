import { useEffect, useRef, useState } from 'react';
import { QueryState, queryClient } from '@/data/query/queryClient.js';

type UseQueryOptions = {
	staleTimeMs?: number;
	enabled?: boolean;
};

export const useQuery = <T>(
	key: string,
	fetcher: () => Promise<T>,
	options: UseQueryOptions = {},
): QueryState<T> => {
	const [state, setState] = useState<QueryState<T>>(() => queryClient.getState<T>(key));
	const fetcherRef = useRef(fetcher);
	const optionsRef = useRef(options);
	const lastFetchedKeyRef = useRef<string | null>(null);
	const isFetchingRef = useRef(false);
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

	// Refetch when state becomes idle or stale (after cache invalidation)
	useEffect(() => {
		const shouldRefetch =
			(state.status === 'idle' || state.isStale) &&
			optionsRef.current.enabled !== false &&
			!isFetchingRef.current;

		if (shouldRefetch) {
			isFetchingRef.current = true;
			queryClient
				.fetchQuery<T>(key, fetcherRef.current, optionsRef.current)
				.catch(() => undefined)
				.finally(() => {
					isFetchingRef.current = false;
				});
		}
	}, [state.status, state.isStale, key]);

	return state;
};
