import { useCallback } from 'react';
import { getStandings } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { useQuery } from '@/data/query/useQuery.js';

export const useStandings = () => {
	const key = queryKeys.standings();
	const fetcher = useCallback(() => getStandings(), []);
	return useQuery(key, fetcher, { staleTimeMs: 60_000 });
};
