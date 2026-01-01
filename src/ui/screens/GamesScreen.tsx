import { Box, Text, useApp, useStdout } from 'ink';
import { useMemo } from 'react';
import { useGame } from '@/data/hooks/useGame.js';
import { useGamesPage } from '@/data/hooks/useGamesPage.js';
import { useStandings } from '@/data/hooks/useStandings.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { useAutoRefresh } from '@/hooks/useAutoRefresh.js';
import { useGameAutoAdvance } from '@/hooks/useGameAutoAdvance.js';
import { useGameSelection } from '@/hooks/useGameSelection.js';
import { useGamesKeyBindings } from '@/hooks/useGamesKeyBindings.js';
import { useAppStore } from '@/state/useAppStore.js';
import GameDetail from '@/ui/components/game-detail/GameDetail.js';
import List from '@/ui/components/List.js';
import SplitPane from '@/ui/components/SplitPane.js';
import StatusBar from '@/ui/components/StatusBar.js';
import TeamSearchScreen from '@/ui/screens/TeamSearchScreen.js';
import {
	getGamesHeader,
	getPlaysCount,
	getPlayersRosterCount,
	getRefreshInterval,
	getTeamStandings,
} from './GamesScreen.helpers.js';

const GamesScreen: React.FC = () => {
	const { exit } = useApp();
	const { stdout } = useStdout();
	const width = stdout?.columns ?? 80;
	const height = stdout?.rows ?? 24;
	const {
		focusedPane,
		listCursorIndex,
		pageCursor,
		selectedGameId,
		detailTab,
		playsScrollIndex,
		playsSortOrder,
		playersTeamTab,
		playersScrollIndex,
		teamSearchOpen,
		gameTeamFilter,
		standingsViewMode,
		moveCursor,
		selectGame,
		setFocusedPane,
		setPageCursor,
		setDetailTab,
		movePlaysScroll,
		togglePlaysSortOrder,
		setPlayersTeamTab,
		movePlayersScroll,
	} = useAppStore();

	const listHeight = Math.max(6, height - 4);
	const { data, status, error, limit } = useGamesPage({ cursor: pageCursor, limit: listHeight });
	const standings = useStandings();
	const games = useMemo(() => {
		const allGames = data?.items ?? [];
		if (!gameTeamFilter) return allGames;
		return allGames.filter(
			(game) => game.homeTeam.includes(gameTeamFilter) || game.awayTeam.includes(gameTeamFilter),
		);
	}, [data, gameTeamFilter]);
	const detail = useGame(selectedGameId);

	// Auto-advance to next day if all today's games are final
	useGameAutoAdvance({ pageCursor, status, data, games, setPageCursor });

	// Simplified state - use detail data directly
	const displayGame = detail.data ?? null;
	const displayStatus = detail.status === 'idle' ? 'loading' : detail.status;

	// Determine refresh interval using helper
	const refreshIntervalMs = getRefreshInterval(selectedGameId, displayGame);

	// Auto-refresh selected game
	const { resetTimer } = useAutoRefresh({
		enabled: Boolean(selectedGameId),
		intervalMs: refreshIntervalMs,
		onRefresh: () => {
			if (selectedGameId) {
				queryClient.invalidate(queryKeys.gameDetail(selectedGameId));
			}
		},
	});

	// Auto-select game at cursor + reset scroll on navigation
	useGameSelection({
		status,
		games,
		listCursorIndex,
		selectedGameId,
		detailTab,
		pageCursor,
		moveCursor,
		selectGame,
	});

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
				// Ignore errors if the parent process is already gone.
			}
		}
		process.exit(0);
	};

	const playsCount = getPlaysCount(detailTab, displayGame);
	const playersRosterCount = getPlayersRosterCount();

	useGamesKeyBindings({
		focusedPane,
		detailTab,
		games,
		listCursorIndex,
		pageCursor,
		selectedGameId,
		displayGame,
		data: data ?? null,
		limit,
		playsCount,
		playersTeamTab,
		playersScrollIndex,
		playersRosterCount,
		onQuit: quit,
		moveCursor,
		selectGame,
		setFocusedPane,
		setPageCursor,
		setDetailTab,
		movePlaysScroll,
		togglePlaysSortOrder,
		setPlayersTeamTab,
		movePlayersScroll,
		onInteraction: resetTimer,
	});

	const header = useMemo(
		() => getGamesHeader(status, games.length, pageCursor, gameTeamFilter),
		[status, games.length, pageCursor, gameTeamFilter],
	);

	const teamStandings = useMemo(
		() => getTeamStandings(displayGame, standings.data),
		[displayGame, standings.data],
	);

	const detailPane = () => {
		if (!selectedGameId) {
			return <Text dimColor>Select a game to view details.</Text>;
		}

		return (
			<GameDetail
				game={displayGame}
				status={displayStatus}
				detailTab={detailTab}
				playsScrollIndex={playsScrollIndex}
				playersScrollIndex={playersScrollIndex}
				playsSortOrder={playsSortOrder}
				height={height}
				teamStandings={teamStandings}
				standingsViewMode={standingsViewMode}
			/>
		);
	};

	const listPane = () => {
		const lineWidth = Math.max(1, Math.floor(width / 2) - 10); // Half width minus borders/margins

		if (status === 'error') {
			return (
				<Box flexDirection="column">
					<Text>{header}</Text>
					<Text dimColor>{'─'.repeat(lineWidth)}</Text>
					<Box flexDirection="column" paddingTop={2}>
						<Text color="red">Failed to load games</Text>
						<Text dimColor>{error instanceof Error ? error.message : 'Unknown error'}</Text>
						<Box marginTop={1}>
							<Text dimColor>Press 'q' to quit</Text>
						</Box>
					</Box>
				</Box>
			);
		}

		return (
			<Box flexDirection="column">
				<Text>{header}</Text>
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
				<List
					items={games}
					cursorIndex={listCursorIndex}
					height={listHeight}
					loading={status === 'loading'}
				/>
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
				pageCursor={pageCursor}
				loading={status === 'loading'}
				error={error instanceof Error ? error.message : null}
			/>
		</Box>
	);
};

export default GamesScreen;
