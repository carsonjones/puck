import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useEffect, useMemo } from 'react';
import { usePlayerDetail } from '@/data/hooks/usePlayerDetail.js';
import { usePlayersLeaderboard } from '@/data/hooks/usePlayersLeaderboard.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { useAutoRefresh } from '@/hooks/useAutoRefresh.js';
import { useAppStore } from '@/state/useAppStore.js';
import PlayersList from '@/ui/components/PlayersList.js';
import PlayerDetail from '@/ui/components/player-detail/PlayerDetail.js';
import SplitPane from '@/ui/components/SplitPane.js';
import StatusBar from '@/ui/components/StatusBar.js';
import TeamSearchScreen from '@/ui/screens/TeamSearchScreen.js';

const PlayersScreen: React.FC = () => {
	const { exit } = useApp();
	const { stdout } = useStdout();
	const width = Math.max(40, stdout?.columns ?? 80);
	const height = stdout?.rows ?? 24;

	const {
		focusedPane,
		playersCursorIndex,
		selectedPlayerId,
		playerDetailTab,
		teamSearchOpen,
		playerFilter,
		movePlayersCursor,
		selectPlayer,
		setFocusedPane,
		setPlayerDetailTab,
		movePlayerDetailScroll,
		setViewMode,
		openTeamSearch,
		setPlayerFilter,
	} = useAppStore();

	const listHeight = Math.max(6, height - 4);
	const { data: players, status, error } = usePlayersLeaderboard();

	const items = useMemo(() => players ?? [], [players]);

	// Get team abbrev for selected player for faster roster lookup
	const selectedPlayerTeam = useMemo(() => {
		if (!selectedPlayerId || !items.length) return undefined;
		const player = items.find((p) => p.id === selectedPlayerId);
		return player?.teamAbbrev;
	}, [selectedPlayerId, items]);

	const playerDetail = usePlayerDetail(selectedPlayerId, selectedPlayerTeam);

	// Auto-refresh every 5 minutes
	const { resetTimer } = useAutoRefresh({
		enabled: true,
		intervalMs: 300_000,
		onRefresh: () => {
			queryClient.invalidate(queryKeys.playersLeaderboard());
		},
	});

	// Auto-select player based on cursor position (unless filter is active)
	useEffect(() => {
		if (status !== 'success') return;

		// If filter is active, don't auto-select from cursor
		if (playerFilter !== null) return;

		if (items.length === 0) {
			if (selectedPlayerId !== null) selectPlayer(null);
			return;
		}

		const clampedIndex = Math.min(playersCursorIndex, items.length - 1);
		if (clampedIndex !== playersCursorIndex) {
			movePlayersCursor(0, items.length - 1);
			return;
		}
		const item = items[clampedIndex];
		if (item && item.id !== selectedPlayerId) {
			selectPlayer(item.id);
		}
	}, [
		status,
		items,
		playersCursorIndex,
		selectedPlayerId,
		selectPlayer,
		movePlayersCursor,
		playerFilter,
	]);

	// Sync cursor to pre-selected player (e.g., from team roster) - only when selectedPlayerId changes
	useEffect(() => {
		if (status !== 'success' || items.length === 0 || selectedPlayerId === null) return;
		const playerIndex = items.findIndex((p) => p.id === selectedPlayerId);
		if (playerIndex >= 0 && playerIndex !== playersCursorIndex) {
			movePlayersCursor(playerIndex - playersCursorIndex, items.length - 1);
			// Player is in list, clear filter
			if (playerFilter !== null) setPlayerFilter(null);
		} else if (playerIndex === -1 && playerFilter === null) {
			// Player not in list and no filter set - set filter
			setPlayerFilter(selectedPlayerId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		selectedPlayerId,
		items,
		status,
		movePlayersCursor,
		playerFilter,
		playersCursorIndex, // Player not in list and no filter set - set filter
		setPlayerFilter,
	]);

	const quit = () => {
		exit();
		const isWatchMode =
			process.env.TSX_WATCH === 'true' ||
			process.env.TSX_WATCH === '1' ||
			Boolean(process.env.TSX_WATCH_PATH) ||
			Boolean(process.env.TSX_WATCH_MODE);
		if (isWatchMode) {
			try {
				process.kill(process.ppid, 'SIGINT');
			} catch {
				// Ignore
			}
		}
		process.exit(0);
	};

	// Keyboard bindings
	useInput((input, key) => {
		resetTimer();

		// Check if team search modal is open - if so, don't process keys here
		if (teamSearchOpen) {
			return;
		}

		// Team search modal trigger
		if (input === '/' || (key.ctrl && input === 't')) {
			openTeamSearch();
			return;
		}

		if (input.toLowerCase() === 'q' || (key.ctrl && input === 'c')) {
			quit();
			return;
		}

		if (input === 'g') {
			setViewMode('games');
			return;
		}

		if (input === 's') {
			setViewMode('standings');
			return;
		}

		if (input === 'p') {
			setViewMode('players');
			return;
		}

		if (input === 'x') {
			// Clear player filter
			if (playerFilter !== null) {
				setPlayerFilter(null);
				return;
			}
		}

		if (key.escape) {
			setFocusedPane('list');
			return;
		}

		if (input === '\t' || key.tab) {
			setFocusedPane(focusedPane === 'list' ? 'detail' : 'list');
			return;
		}

		if (input === 'r') {
			queryClient.invalidate(queryKeys.playersLeaderboard());
			if (selectedPlayerId) {
				queryClient.invalidate(queryKeys.playerDetail(selectedPlayerId));
				queryClient.invalidate(queryKeys.playerGameLog(selectedPlayerId));
			}
			return;
		}

		// Tab switching for detail view
		if (input === '1') {
			setPlayerDetailTab('season');
			return;
		}
		if (input === '2') {
			setPlayerDetailTab('about');
			return;
		}
		if (input === '3') {
			setPlayerDetailTab('games');
			return;
		}

		if (focusedPane === 'list') {
			if (input === 'j' || key.downArrow) {
				movePlayersCursor(1, Math.max(0, items.length - 1));
				return;
			}
			if (input === 'k' || key.upArrow) {
				movePlayersCursor(-1, Math.max(0, items.length - 1));
				return;
			}
			if (input === 'l' || key.rightArrow || key.return) {
				setFocusedPane('detail');
				return;
			}
		}

		if (focusedPane === 'detail') {
			// Tab navigation with arrow keys
			if (input === 'l' || key.rightArrow) {
				// Cycle through tabs: season → about → games
				if (playerDetailTab === 'season') {
					setPlayerDetailTab('about');
				} else if (playerDetailTab === 'about') {
					setPlayerDetailTab('games');
				}
				// Stay on games if already there
				return;
			}

			if (input === 'h' || key.leftArrow) {
				// Go back through tabs, or back to list if on first tab
				if (playerDetailTab === 'season') {
					setFocusedPane('list');
				} else if (playerDetailTab === 'about') {
					setPlayerDetailTab('season');
				} else if (playerDetailTab === 'games') {
					setPlayerDetailTab('about');
				}
				return;
			}

			// Scrolling in games tab
			if (playerDetailTab === 'games') {
				if (input === 'j' || key.downArrow) {
					movePlayerDetailScroll(1, 999);
					return;
				}
				if (input === 'k' || key.upArrow) {
					movePlayerDetailScroll(-1);
					return;
				}
			}
		}
	});

	const header = useMemo(() => {
		if (status === 'loading') return 'Loading players';
		if (status === 'error') return 'Players';
		const filterName =
			playerFilter !== null && playerDetail.data
				? `${playerDetail.data.firstName.charAt(0)}. ${playerDetail.data.lastName}`
				: null;
		const filterSuffix = filterName ? ` (Filtered: ${filterName})` : '';
		return `Top Scorers (${items.length})${filterSuffix}`;
	}, [status, items.length, playerFilter, playerDetail.data]);

	const detailPane = () => {
		// Don't show error if no player selected
		let status = playerDetail.status === 'idle' ? 'loading' : playerDetail.status;
		if (status === 'error' && !selectedPlayerId) {
			status = 'loading';
		}
		return <PlayerDetail player={playerDetail.data ?? null} status={status} height={height} />;
	};

	const listPane = () => {
		const lineWidth = Math.max(10, Math.floor(width / 2) - 14);

		if (status === 'error') {
			return (
				<Box flexDirection="column">
					<Text>{header}</Text>
					<Box flexDirection="column" paddingTop={2}>
						<Text color="red">Failed to load players</Text>
						<Text dimColor>{error instanceof Error ? error.message : 'Unknown error'}</Text>
					</Box>
				</Box>
			);
		}

		return (
			<Box flexDirection="column">
				<Box minHeight={1}>
					<Text>{header}</Text>
				</Box>
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
				<Box marginTop={1}>
					<PlayersList
						items={items}
						cursorIndex={playersCursorIndex}
						height={listHeight}
						loading={status === 'loading'}
						hideSelection={playerFilter !== null}
					/>
				</Box>
			</Box>
		);
	};

	// If team search is active, show search screen instead
	if (teamSearchOpen) {
		return <TeamSearchScreen />;
	}

	return (
		<Box flexDirection="column" width={width} height={height} padding={1}>
			<Box flexGrow={1}>
				<SplitPane left={listPane()} right={detailPane()} />
			</Box>
			<StatusBar
				focus={focusedPane}
				pageCursor={null}
				loading={status === 'loading'}
				error={error instanceof Error ? error.message : null}
			/>
		</Box>
	);
};

export default PlayersScreen;
