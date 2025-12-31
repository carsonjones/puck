import { useEffect } from 'react';
import { formatDate } from '@/data/api/client.js';
import type { GameListItem } from '@/data/api/client.js';

interface UseGameAutoAdvanceOptions {
	pageCursor: string | null;
	status: 'idle' | 'loading' | 'success' | 'error';
	data: { items: GameListItem[]; nextCursor: string | null } | undefined;
	games: GameListItem[];
	setPageCursor: (cursor: string) => void;
}

export function useGameAutoAdvance({
	pageCursor,
	status,
	data,
	games,
	setPageCursor,
}: UseGameAutoAdvanceOptions) {
	useEffect(() => {
		if (pageCursor !== null || status !== 'success' || !data) return;

		const allGamesFinal = games.length > 0 && games.every((game) => game.status === 'final');

		if (allGamesFinal) {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			setPageCursor(formatDate(tomorrow));
		}
	}, [pageCursor, status, data, games, setPageCursor]);
}
