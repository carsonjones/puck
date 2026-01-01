import { useEffect, useRef } from 'react';
import type { GameListItem } from '@/data/api/client.js';
import { type GameStatus, useAppStore } from '@/state/useAppStore.js';

interface UseGameSelectionOptions {
	status: 'idle' | 'loading' | 'success' | 'error';
	games: GameListItem[];
	listCursorIndex: number;
	selectedGameId: string | null;
	detailTab: 'stats' | 'plays' | 'players';
	pageCursor: string | null;
	moveCursor: (delta: number, maxIndex?: number) => void;
	selectGame: (id: string | null, status?: GameStatus) => void;
}

export function useGameSelection({
	status,
	games,
	listCursorIndex,
	selectedGameId,
	detailTab,
	pageCursor,
	moveCursor,
	selectGame,
}: UseGameSelectionOptions) {
	// Auto-select game at cursor position
	useEffect(() => {
		if (status !== 'success') return;
		if (games.length === 0) {
			if (selectedGameId !== null) selectGame(null);
			return;
		}
		const clampedIndex = Math.min(listCursorIndex, games.length - 1);
		if (clampedIndex !== listCursorIndex) {
			moveCursor(0, games.length - 1);
			return;
		}
		const item = games[clampedIndex];
		if (item && item.id !== selectedGameId) {
			selectGame(item.id, item.status);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, games, listCursorIndex, selectedGameId, moveCursor, selectGame]);

	// Reset list cursor to 0 on date change
	const previousCursor = useRef<string | null>(pageCursor);

	useEffect(() => {
		if (status !== 'success' || games.length === 0) return;
		if (previousCursor.current !== pageCursor) {
			moveCursor(-listCursorIndex, games.length - 1);
			previousCursor.current = pageCursor;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageCursor, status, games.length, listCursorIndex, moveCursor]);

	// Reset plays scroll to 0 on game/tab change
	const previousGameId = useRef<string | null>(null);
	const previousTab = useRef<string | null>(null);

	useEffect(() => {
		if (previousGameId.current !== selectedGameId || previousTab.current !== detailTab) {
			if (previousGameId.current !== null || previousTab.current !== null) {
				useAppStore.setState({ playsScrollIndex: 0 });
			}
			previousGameId.current = selectedGameId;
			previousTab.current = detailTab;
		}
	}, [selectedGameId, detailTab]);
}
