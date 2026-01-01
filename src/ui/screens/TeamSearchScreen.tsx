import { Box, Text, useInput, useStdout } from 'ink';
import type { StandingListItem } from '@/data/api/client.js';
import { useStandings } from '@/data/hooks/useStandings.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';
import { useAppStore } from '@/state/useAppStore.js';
import { fuzzyMatchTeams } from '@/utils/fuzzyMatch.js';

const TeamSearchScreen: React.FC = () => {
	const { stdout } = useStdout();
	const width = stdout?.columns ?? 80;
	const height = stdout?.rows ?? 24;

	const {
		teamSearchQuery: query,
		teamSearchCursorIndex: cursorIndex,
		viewMode,
		closeTeamSearch,
		setTeamSearchQuery,
		moveTeamSearchCursor,
		setGameTeamFilter,
		setViewMode,
		setStandingsTab,
		moveStandingsCursor,
		setFocusedPane,
		standingsCursorIndex,
	} = useAppStore();

	const { data: standingsData, status } = useStandings();

	// Get all teams from standings
	const allTeams: StandingListItem[] = standingsData?.league ?? [];

	// Filter teams using fuzzy match
	const filteredMatches = fuzzyMatchTeams(query, allTeams);
	const filteredTeams = filteredMatches.map((m) => m.team);

	// Scrolling window for results
	const { visible: visibleTeams, start } = useWindowedList(filteredTeams, cursorIndex, height, 12);

	const handleTeamSelection = (team: StandingListItem, action: 'context' | 'roster' | 'games') => {
		if (action === 'roster') {
			// Go to standings detail for roster
			navigateToTeamInStandings(team, 'detail');
		} else if (action === 'games') {
			// Go to games filtered by team
			setGameTeamFilter(team.teamAbbrev);
			setViewMode('games');
			setFocusedPane('list');
		} else {
			// Context-aware action
			if (viewMode === 'games') {
				setGameTeamFilter(team.teamAbbrev);
				setViewMode('games');
				setFocusedPane('list');
			} else if (viewMode === 'standings') {
				navigateToTeamInStandings(team, 'list');
			} else {
				// Default: go to standings
				navigateToTeamInStandings(team, 'list');
			}
		}
		closeTeamSearch();
	};

	const navigateToTeamInStandings = (team: StandingListItem, focusPane: 'list' | 'detail') => {
		if (!allTeams || allTeams.length === 0) return;

		// Find team index in league-wide list
		const teamIndex = allTeams.findIndex((t) => t.teamAbbrev === team.teamAbbrev);
		if (teamIndex < 0) return;

		// Calculate absolute delta to target position
		const delta = teamIndex - standingsCursorIndex;

		// Clear games filter only when navigating from games view
		if (viewMode === 'games') {
			setGameTeamFilter(null);
		}

		// Apply all state changes together
		setStandingsTab('league');
		setViewMode('standings');
		setFocusedPane(focusPane);
		moveStandingsCursor(delta, allTeams.length - 1);
	};

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape) {
			closeTeamSearch();
			return;
		}

		if (key.return && filteredTeams.length > 0) {
			const selected = filteredTeams[cursorIndex];
			if (selected) handleTeamSelection(selected, 'context');
			return;
		}

		if (input === 'r' && filteredTeams.length > 0) {
			const selected = filteredTeams[cursorIndex];
			if (selected) handleTeamSelection(selected, 'roster');
			return;
		}

		if (input === 'g' && filteredTeams.length > 0) {
			const selected = filteredTeams[cursorIndex];
			if (selected) handleTeamSelection(selected, 'games');
			return;
		}

		if ((input === 'j' || key.downArrow) && filteredTeams.length > 0) {
			moveTeamSearchCursor(1, filteredTeams.length - 1);
			return;
		}

		if ((input === 'k' || key.upArrow) && filteredTeams.length > 0) {
			moveTeamSearchCursor(-1, filteredTeams.length - 1);
			return;
		}

		if (key.backspace || key.delete) {
			if (query.length > 0) {
				setTeamSearchQuery(query.slice(0, -1));
			}
			return;
		}

		// Alphanumeric and space input
		if (input && input.length === 1 && /[a-zA-Z0-9 ]/.test(input)) {
			setTeamSearchQuery(query + input);
			return;
		}
	});

	// Context-specific hint
	let contextHint = 'select';
	if (viewMode === 'games') {
		contextHint = 'stay';
	} else if (viewMode === 'standings') {
		contextHint = 'jump';
	}

	const lineWidth = Math.max(20, width - 4);

	return (
		<Box flexDirection="column" width={width} height={height} padding={1}>
			{/* Header */}
			<Box flexDirection="column">
				<Text bold>Search Teams</Text>
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
			</Box>

			{/* Search input */}
			<Box marginTop={1} marginBottom={1}>
				<Text>Query: </Text>
				<Text color="yellow">{query || '(type to search)'}</Text>
				{query && <Text>█</Text>}
			</Box>

			{/* Results list */}
			<Box flexDirection="column" flexGrow={1}>
				{status === 'loading' ? (
					<Text dimColor>Loading teams...</Text>
				) : filteredTeams.length === 0 ? (
					<Text dimColor>No teams found</Text>
				) : (
					<>
						<Text dimColor>
							{filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found
						</Text>
						<Box marginTop={1} flexDirection="column">
							{visibleTeams.map((team, index) => {
								const absoluteIndex = start + index;
								const isSelected = absoluteIndex === cursorIndex;
								const text = `${team.teamAbbrev} - ${team.teamName}`;
								const padding = Math.max(0, lineWidth - text.length);
								const fullText = `${text}${' '.repeat(padding)}`;
								return (
									<Box key={`${absoluteIndex}-${team.teamAbbrev}`} minHeight={1}>
										<Text inverse={isSelected}>{fullText}</Text>
									</Box>
								);
							})}
						</Box>
					</>
				)}
			</Box>

			{/* Footer hints */}
			<Box marginTop={1} borderStyle="single" borderTop>
				<Text dimColor>
					[↑↓/jk] nav | [enter] {contextHint} | [g] games | [r] roster | [esc] close
				</Text>
			</Box>
		</Box>
	);
};

export default TeamSearchScreen;
