import { useCallback } from 'react';
import { getPlayerGameLog } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { useQuery } from '@/data/query/useQuery.js';

export const usePlayerGameLog = (playerId: number | null) => {
	const key = playerId !== null ? queryKeys.playerGameLog(playerId) : null;
	const fetcher = useCallback(() => {
		if (playerId === null) throw new Error('No player ID');
		return getPlayerGameLog(playerId, 10); // Reduced from 20 to 10 for faster load
	}, [playerId]);

	return useQuery(key ?? '', fetcher, { staleTimeMs: 300_000 });
};
