import { useInput } from 'ink';
import type { GameDetail, GameListItem } from '@/data/api/client.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { type FocusedPane, type GameStatus, useAppStore } from '@/state/useAppStore.js';
import { formatDate } from '@/utils/dateUtils.js';
import { getBoxscorePlayersList } from '@/utils/nhlUtils.js';

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
	allPlayers: Array<{ id?: number; playerId?: number }>;
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
		limit,
		playsCount,
		playersTeamTab,
		playersScrollIndex,
		allPlayers,
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

		const { teamSearchOpen } = useAppStore.getState();
		if (teamSearchOpen) return;

		// Team search modal
		if (input === '/' || (key.ctrl && input === 't')) {
			useAppStore.getState().openTeamSearch();
			return;
		}

		// Clear team filter
		if (input === 'x') {
			useAppStore.getState().setGameTeamFilter(null);
			setFocusedPane('list');
			return;
		}

		// Global: Quit
		if (input.toLowerCase() === 'q' || (key.ctrl && input === 'c')) {
			onQuit();
			return;
		}

		// Global: View switching
		if (input === 's') {
			useAppStore.getState().setViewMode('standings');
			return;
		}
		if (input === 'g') {
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
		if (input === 'o') {
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
				if (allPlayers.length > 0) {
					if (input === 'j' || key.downArrow) {
						movePlayersScroll(1, allPlayers.length - 1);
						return;
					}
					if (input === 'k' || key.upArrow) {
						movePlayersScroll(-1, allPlayers.length - 1);
						return;
					}
					if (key.return) {
						const selectedPlayer = allPlayers[playersScrollIndex];
						if (selectedPlayer?.id) {
							const { selectPlayer, setPlayerFilter, setFocusedPane, setViewMode } =
								useAppStore.getState();
							selectPlayer(selectedPlayer.id);
							setPlayerFilter(selectedPlayer.id);
							setFocusedPane('detail');
							setViewMode('players');
						}
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
				// Enter key for players tab with in-progress/final game
				if (detailTab === 'players' && key.return) {
					// Calculate player index accounting for headers
					const allBoxscorePlayers = getBoxscorePlayersList(displayGame?.boxscore);
					const awayPlayers = allBoxscorePlayers.slice(0, allBoxscorePlayers.length / 2);
					const homePlayers = allBoxscorePlayers.slice(allBoxscorePlayers.length / 2);

					// For in-progress/final games, use playsScrollIndex not playersScrollIndex
					const { playsScrollIndex: scrollIndex } = useAppStore.getState();
					// scrollIndex includes 3 headers (awayTeam, separator, homeTeam)
					if (
						scrollIndex === 0 ||
						scrollIndex === awayPlayers.length + 1 ||
						scrollIndex === awayPlayers.length + 2
					) {
						// Selected a header row, ignore
						return;
					}

					let selectedPlayer: { playerId?: number } | undefined;
					if (scrollIndex < awayPlayers.length + 1) {
						// Away team player (index 1 to awayPlayers.length)
						selectedPlayer = awayPlayers[scrollIndex - 1];
					} else {
						// Home team player (index > awayPlayers.length + 2)
						selectedPlayer = homePlayers[scrollIndex - awayPlayers.length - 3];
					}

					if (selectedPlayer?.playerId) {
						const { selectPlayer, setPlayerFilter, setFocusedPane, setViewMode } =
							useAppStore.getState();
						selectPlayer(selectedPlayer.playerId);
						setPlayerFilter(selectedPlayer.playerId);
						setFocusedPane('detail');
						setViewMode('players');
					}
					return;
				}
			}
		}
	});
};
