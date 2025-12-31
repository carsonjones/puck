import { Box, Text, useApp, useStdout } from 'ink';
import { useEffect, useMemo } from 'react';
import { useStandings } from '@/data/hooks/useStandings.js';
import { queryKeys } from '@/data/query/keys.js';
import { queryClient } from '@/data/query/queryClient.js';
import { useAutoRefresh } from '@/hooks/useAutoRefresh.js';
import { useStandingsKeyBindings } from '@/hooks/useStandingsKeyBindings.js';
import { useAppStore } from '@/state/useAppStore.js';
import SplitPane from '@/ui/components/SplitPane.js';
import StandingsList from '@/ui/components/StandingsList.js';
import StatusBar from '@/ui/components/StatusBar.js';
import StandingsDetail from '@/ui/components/standings-detail/StandingsDetail.js';
import { useTeamRosterData } from '@/ui/components/standings-detail/useTeamRosterData.js';
import Tabs from '@/ui/components/Tabs.js';
import TeamSearchScreen from '@/ui/screens/TeamSearchScreen.js';

const StandingsScreen: React.FC = () => {
	const { exit } = useApp();
	const { stdout } = useStdout();
	const width = Math.max(40, stdout?.columns ?? 80); // Ensure minimum width
	const height = stdout?.rows ?? 24;

	const {
		focusedPane,
		standingsCursorIndex,
		standingsTab,
		standingsPlayersScrollIndex,
		standingsConference,
		standingsDivision,
		standingsViewMode,
		teamSearchOpen,
		pendingTeamNavigation,
		moveStandingsCursor,
		setFocusedPane,
		setStandingsTab,
		moveStandingsPlayersScroll,
		setStandingsConference,
		setStandingsDivision,
		cycleStandingsViewMode,
		setViewMode,
		selectPlayer,
		setPreviousStandingsState,
		openTeamSearch,
		clearPendingTeamNavigation,
	} = useAppStore();

	const listHeight = Math.max(6, height - 4);
	const { data, status, error } = useStandings();

	// Determine which list to show based on tab
	const items = useMemo(() => {
		if (!data) return [];

		if (standingsTab === 'league') {
			return data.league;
		} else if (standingsTab === 'conference') {
			return standingsConference === 'eastern' ? data.eastern : data.western;
		} else {
			return data.divisions[standingsDivision];
		}
	}, [data, standingsTab, standingsConference, standingsDivision]);

	const selectedTeam = items[standingsCursorIndex] ?? null;
	const roster = useTeamRosterData(selectedTeam?.teamAbbrev ?? null);

	// Auto-refresh every 5 minutes (300s)
	const { resetTimer } = useAutoRefresh({
		enabled: true,
		intervalMs: 300_000,
		onRefresh: () => {
			queryClient.invalidate(queryKeys.standings());
		},
	});

	// Clamp cursor when items change
	useEffect(() => {
		if (items.length > 0 && standingsCursorIndex >= items.length) {
			moveStandingsCursor(-(standingsCursorIndex - (items.length - 1)), items.length - 1);
		}
	}, [items.length, standingsCursorIndex, moveStandingsCursor]);

	// Handle pending team navigation from games screen
	useEffect(() => {
		if (pendingTeamNavigation && data) {
			const teamIndex = data.league.findIndex((t) => t.teamAbbrev === pendingTeamNavigation);
			if (teamIndex >= 0) {
				// Switch to league tab and set cursor to team
				setStandingsTab('league');
				moveStandingsCursor(teamIndex - standingsCursorIndex, data.league.length - 1);
			}
			clearPendingTeamNavigation();
		}
	}, [
		pendingTeamNavigation,
		data,
		standingsCursorIndex,
		setStandingsTab,
		moveStandingsCursor,
		clearPendingTeamNavigation,
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
				// Ignore errors if the parent process is already gone.
			}
		}
		process.exit(0);
	};

	const allRoster = useMemo(
		() => [...roster.players, ...roster.goalies],
		[roster.players, roster.goalies],
	);

	useStandingsKeyBindings({
		focusedPane,
		items,
		standingsCursorIndex,
		standingsTab,
		standingsConference,
		standingsDivision,
		standingsPlayersScrollIndex,
		selectedTeam,
		rosterLoading: roster.loading,
		rosterCount: allRoster.length,
		allRoster,
		onQuit: quit,
		onInteraction: resetTimer,
	});

	const header = useMemo(() => {
		if (status === 'loading') return 'Loading standings';
		if (status === 'error') return 'Standings';

		const viewSuffix =
			standingsViewMode === 'home' ? ' (Home)' : standingsViewMode === 'road' ? ' (Road)' : '';

		if (standingsTab === 'league') return `League Standings${viewSuffix}`;
		if (standingsTab === 'conference') {
			return `${standingsConference === 'eastern' ? 'Eastern' : 'Western'} Conference${viewSuffix}`;
		}
		return `${standingsDivision.charAt(0).toUpperCase() + standingsDivision.slice(1)} Division${viewSuffix}`;
	}, [status, standingsTab, standingsConference, standingsDivision, standingsViewMode]);

	const detailPane = () => {
		return <StandingsDetail team={selectedTeam} height={height} />;
	};

	const listPane = () => {
		const lineWidth = Math.max(10, Math.floor(width / 2) - 14); // Half width minus padding/borders

		if (status === 'error') {
			return (
				<Box flexDirection="column">
					<Text>{header}</Text>
					<Box flexDirection="column" paddingTop={2}>
						<Text color="red">Failed to load standings</Text>
						<Text dimColor>{error instanceof Error ? error.message : 'Unknown error'}</Text>
					</Box>
				</Box>
			);
		}

		let subtabs: string[] = [];
		let activeSubtab = '';
		if (standingsTab === 'conference') {
			subtabs = ['eastern', 'western'];
			activeSubtab = standingsConference;
		} else if (standingsTab === 'division') {
			subtabs = ['atlantic', 'metropolitan', 'central', 'pacific'];
			activeSubtab = standingsDivision;
		}

		return (
			<Box flexDirection="column">
				<Box minHeight={1}>
					<Text>{header}</Text>
				</Box>
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
				<Tabs tabs={['league', 'conference', 'division']} active={standingsTab} />
				{subtabs.length > 0 && <Tabs tabs={subtabs} active={activeSubtab} />}
				<Box marginTop={1}>
					<StandingsList
						items={items}
						cursorIndex={standingsCursorIndex}
						height={listHeight}
						loading={status === 'loading'}
						viewMode={standingsViewMode}
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

export default StandingsScreen;
