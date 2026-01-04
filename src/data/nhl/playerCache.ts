import type { PlayerSearchResult } from './models';

export interface PlayerCacheState {
	players: PlayerSearchResult[];
	lastUpdated: number | null;
	isLoading: boolean;
	error: string | null;
}

class PlayerCache {
	private cache: PlayerCacheState = {
		players: [],
		lastUpdated: null,
		isLoading: false,
		error: null,
	};

	private listeners = new Set<() => void>();

	/**
	 * Get all cached players
	 */
	getPlayers(): PlayerSearchResult[] {
		return this.cache.players;
	}

	/**
	 * Get cache state
	 */
	getState(): PlayerCacheState {
		return { ...this.cache };
	}

	/**
	 * Set cached players
	 */
	setPlayers(players: PlayerSearchResult[]): void {
		this.cache = {
			players,
			lastUpdated: Date.now(),
			isLoading: false,
			error: null,
		};
		this.notifyListeners();
	}

	/**
	 * Set loading state
	 */
	setLoading(isLoading: boolean): void {
		this.cache = {
			...this.cache,
			isLoading,
		};
		this.notifyListeners();
	}

	/**
	 * Set error state
	 */
	setError(error: string): void {
		this.cache = {
			...this.cache,
			error,
			isLoading: false,
		};
		this.notifyListeners();
	}

	/**
	 * Check if cache is stale (older than maxAge ms)
	 */
	isStale(maxAgeMs: number = 15 * 60 * 1000): boolean {
		if (!this.cache.lastUpdated) {
			return true;
		}
		return Date.now() - this.cache.lastUpdated > maxAgeMs;
	}

	/**
	 * Subscribe to cache updates
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * Notify all listeners of cache changes
	 */
	private notifyListeners(): void {
		this.listeners.forEach((listener) => {
			listener();
		});
	}

	/**
	 * Clear the cache
	 */
	clear(): void {
		this.cache = {
			players: [],
			lastUpdated: null,
			isLoading: false,
			error: null,
		};
		this.notifyListeners();
	}
}

// Export singleton instance
export const playerCache = new PlayerCache();
