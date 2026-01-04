import { useEffect, useState } from 'react';
import type { PlayerCacheState } from '@/data/nhl/playerCache.js';
import { playerCache } from '@/data/nhl/playerCache.js';

/**
 * React hook to subscribe to player cache state
 * Returns the current cache state including players, loading status, and last update time
 */
export function usePlayerCache(): PlayerCacheState {
	const [state, setState] = useState<PlayerCacheState>(() => playerCache.getState());

	useEffect(() => {
		// Subscribe to cache updates
		const unsubscribe = playerCache.subscribe(() => {
			setState(playerCache.getState());
		});

		// Cleanup subscription on unmount
		return unsubscribe;
	}, []);

	return state;
}
