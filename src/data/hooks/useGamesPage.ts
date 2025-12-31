import { useCallback, useEffect, useRef } from 'react';
import { listGames } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { useQuery } from '@/data/query/useQuery.js';

const DEFAULT_LIMIT = 10;

export const useGamesPage = ({
	cursor,
	limit = DEFAULT_LIMIT,
}: {
	cursor: string | null;
	limit?: number;
}) => {
	const key = queryKeys.gamesList(cursor, limit);
	const fetcher = useCallback(() => listGames({ cursor, limit }), [cursor, limit]);
	const state = useQuery(key, fetcher, { staleTimeMs: 20_000 });
	const lastPrefetchedRef = useRef<string | null>(null);

	useEffect(() => {
		if (state.status !== 'success' || !state.data?.nextCursor) return;
		const nextKey = queryKeys.gamesList(state.data.nextCursor, limit);
		if (lastPrefetchedRef.current === nextKey) return;
		lastPrefetchedRef.current = nextKey;
		queryClient.prefetchQuery(nextKey, () => listGames({ cursor: state.data?.nextCursor, limit }), {
			staleTimeMs: 20_000,
		});
	}, [state.status, state.data, limit]);

	return { ...state, limit };
};
