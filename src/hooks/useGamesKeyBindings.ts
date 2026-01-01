import { useInput } from 'ink';
import type { GameDetail, GameListItem } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { type FocusedPane, type GameStatus, useAppStore } from '@/state/useAppStore.js';
import { formatDate } from '@/utils/dateUtils.js';

type GamesKeyBindingsConfig = {
	focusedPane: FocusedPane;
	detailTab: string;
	games: GameListItem[];
	listCursorIndex: number;
	pageCursor: string | null;
	selectedGameId: string | null;
	displayGame: GameDetail | null;
	data: { nextCursor?: string | null } | null;
	limit: number;
	playsCount: number;
	playersTeamTab: 'away' | 'home';
	playersScrollIndex: number;
	playersRosterCount: number;
	onQuit: () => void;
	moveCursor: (delta: number, max: number) => void;
	selectGame: (id: string | null, status?: GameStatus) => void;
	setFocusedPane: (pane: FocusedPane) => void;
	setPageCursor: (cursor: string | null) => void;
	setDetailTab: (tab: 'stats' | 'plays' | 'players') => void;
	movePlaysScroll: (delta: number, max: number) => void;
	togglePlaysSortOrder: () => void;
	setPlayersTeamTab: (tab: 'away' | 'home') => void;
	movePlayersScroll: (delta: number, max: number) => void;
	onInteraction?: () => void;
};

export const useGamesKeyBindings = (config: GamesKeyBindingsConfig) => {
	const {
		focusedPane,
		detailTab,
		games,
		listCursorIndex,
		pageCursor,
		selectedGameId,
		displayGame,
		data,
		limit,
		playsCount,
		playersTeamTab,
		playersScrollIndex,
		playersRosterCount,
		onQuit,
		moveCursor,
		selectGame,
		setFocusedPane,
		setPageCursor,
		setDetailTab,
		movePlaysScroll,
		togglePlaysSortOrder,
		setPlayersTeamTab,
		movePlayersScroll,
		onInteraction,
	} = config;

	const resolveCursorDate = (value: string | null) => {
		if (!value) return new Date();
		// Parse YYYY-MM-DD in local timezone (not UTC)
		const [y, m, d] = value.split('-').map(Number);
		const base = new Date(y, m - 1, d);
		return Number.isNaN(base.getTime()) ? new Date() : base;
	};

	useInput((input, key) => {
		onInteraction?.();

		const { teamSearchOpen, cycleStandingsViewMode } = useAppStore.getState();
		if (teamSearchOpen) return;

		// Team search modal
		if (input === '/' || (key.ctrl && input === 't')) {
			useAppStore.getState().openTeamSearch();
			return;
		}

		// Clear team filter
		if (input === 'x') {
			useAppStore.getState().setGameTeamFilter(null);
			return;
		}

		// Global: Quit
		if (input.toLowerCase() === 'q' || (key.ctrl && input === 'c')) {
			onQuit();
			return;
		}

		// Global: View switching
		if (input === 'w') {
			useAppStore.getState().setViewMode('standings');
			return;
		}
		if (input === 'c') {
			useAppStore.getState().setViewMode('games');
			return;
		}
		if (input === 'p') {
			useAppStore.getState().setViewMode('players');
			return;
		}

		// Navigate to standings with home team
		if (input === 'v' && !key.shift) {
			if (displayGame) {
				useAppStore.getState().navigateToTeamInStandings(displayGame.homeTeamAbbrev);
			}
			return;
		}

		// Navigate to standings with away team
		if (input === 'V' || (input === 'v' && key.shift)) {
			if (displayGame) {
				useAppStore.getState().navigateToTeamInStandings(displayGame.awayTeamAbbrev);
			}
			return;
		}

		// Pane switching
		if (key.escape) {
			setFocusedPane('list');
			return;
		}
		if (input === '\t' || key.tab) {
			if (focusedPane === 'list') {
				setFocusedPane('detail');
				return;
			}
			// In detail pane on players tab with scheduled game: toggle team
			if (
				focusedPane === 'detail' &&
				detailTab === 'players' &&
				displayGame?.status === 'scheduled'
			) {
				setPlayersTeamTab(playersTeamTab === 'away' ? 'home' : 'away');
				return;
			}
			// In detail pane: cycle through tabs
			const tabs = ['stats', 'plays', 'players'] as const;
			const currentIndex = tabs.indexOf(detailTab as (typeof tabs)[number]);
			const nextIndex = key.shift
				? (currentIndex - 1 + tabs.length) % tabs.length
				: (currentIndex + 1) % tabs.length;
			setDetailTab(tabs[nextIndex]);
			return;
		}

		// Refresh
		if (input === 'r') {
			queryClient.invalidate(queryKeys.gamesList(pageCursor, limit));
			if (selectedGameId) queryClient.invalidate(queryKeys.gameDetail(selectedGameId));
			return;
		}

		// Tab switching
		if (input === '1') {
			setDetailTab('stats');
			return;
		}
		if (input === '2') {
			setDetailTab('plays');
			return;
		}
		if (input === '3') {
			setDetailTab('players');
			return;
		}

		// Sort toggle
		if (input === 's') {
			togglePlaysSortOrder();
			return;
		}

		// List navigation
		if (focusedPane === 'list') {
			if (input === 'j' || key.downArrow) {
				moveCursor(1, Math.max(0, games.length - 1));
				return;
			}
			if (input === 'k' || key.upArrow) {
				moveCursor(-1, Math.max(0, games.length - 1));
				return;
			}
			if (key.return) {
				const item = games[listCursorIndex];
				if (item) {
					selectGame(item.id, item.status);
					setFocusedPane('detail');
				}
				return;
			}
			if (key.leftArrow) {
				const current = resolveCursorDate(pageCursor);
				const prev = new Date(current);
				prev.setDate(prev.getDate() - 1);
				setPageCursor(formatDate(prev));
				return;
			}
			if (key.rightArrow) {
				const current = resolveCursorDate(pageCursor);
				const next = new Date(current);
				next.setDate(next.getDate() + 1);
				setPageCursor(formatDate(next));
				return;
			}
		}

		// Detail navigation
		if (focusedPane === 'detail') {
			if (input === 'h' || key.leftArrow) {
				setFocusedPane('list');
				return;
			}
			// Players tab with scheduled game - use playersScrollIndex
			if (detailTab === 'players' && displayGame?.status === 'scheduled') {
				if (playersRosterCount > 0) {
					if (input === 'j' || key.downArrow) {
						movePlayersScroll(1, playersRosterCount - 1);
						return;
					}
					if (input === 'k' || key.upArrow) {
						movePlayersScroll(-1, playersRosterCount - 1);
						return;
					}
				}
			}
			// Plays tab or players tab with in-progress/final game - use playsScrollIndex
			if ((detailTab === 'plays' || detailTab === 'players') && playsCount > 0) {
				if (input === 'j' || key.downArrow) {
					movePlaysScroll(1, playsCount - 1);
					return;
				}
				if (input === 'k' || key.upArrow) {
					movePlaysScroll(-1, playsCount - 1);
					return;
				}
			}
		}
	});
};
