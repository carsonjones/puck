import { Box, Text, useInput, useStdout } from 'ink';
import type { StandingListItem } from '@/data/api/client.js';
import { usePlayerCache } from '@/data/hooks/usePlayerCache.js';
import { useStandings } from '@/data/hooks/useStandings.js';
import type { PlayerSearchResult } from '@/data/nhl/models.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';
import { useAppStore } from '@/state/useAppStore.js';
import { fuzzyMatchTeams } from '@/utils/fuzzyMatch.js';
import { fuzzyMatchPlayers } from '@/utils/fuzzyMatchPlayers.js';

type UnifiedSearchResult =
	| { type: 'team'; team: StandingListItem; score: number }
	| { type: 'player'; player: PlayerSearchResult; score: number };

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
		setPlayerFilter,
		selectPlayer,
		setViewMode,
		setStandingsTab,
		moveStandingsCursor,
		setFocusedPane,
		standingsCursorIndex,
	} = useAppStore();

	const { data: standingsData, status } = useStandings();
	const playerCacheState = usePlayerCache();

	// Get all teams from standings
	const allTeams: StandingListItem[] = standingsData?.league ?? [];

	// Get all players from cache (only if query is non-empty to avoid showing all 700+ players)
	const allPlayers: PlayerSearchResult[] = query.trim() ? (playerCacheState.players ?? []) : [];

	// Merge and filter teams + players using fuzzy match
	const teamMatches = fuzzyMatchTeams(query, allTeams).map((m) => ({
		type: 'team' as const,
		team: m.team,
		score: m.score,
	}));

	const playerMatches = fuzzyMatchPlayers(query, allPlayers).map((m) => ({
		type: 'player' as const,
		player: m.player,
		score: m.score,
	}));

	// Merge and sort by score (or alphabetically if no query)
	const filteredResults: UnifiedSearchResult[] = [...teamMatches, ...playerMatches].sort((a, b) => {
		// If no query, sort teams alphabetically
		if (!query.trim()) {
			if (a.type === 'team' && b.type === 'team') {
				return a.team.teamAbbrev.localeCompare(b.team.teamAbbrev);
			}
		}
		// Otherwise sort by fuzzy match score
		return b.score - a.score;
	});

	// Scrolling window for results
	const { visible: visibleResults, start } = useWindowedList(
		filteredResults,
		cursorIndex,
		height,
		12,
	);

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

	const handleUnifiedSelection = (result: UnifiedSearchResult, action?: 'roster' | 'games') => {
		if (result.type === 'team') {
			// Handle team selection with existing logic
			const teamAction = action ?? 'context';
			handleTeamSelection(result.team, teamAction);
		} else {
			// Handle player selection - navigate to players view with filter
			selectPlayer(result.player.playerId);
			setPlayerFilter(result.player.playerId);
			setViewMode('players');
			setFocusedPane('detail');
			closeTeamSearch();
		}
	};

	// Handle keyboard input
	useInput((input, key) => {
		// Shortcuts with capital letters (Shift+R, Shift+G) - check FIRST
		if (input === 'R' && filteredResults.length > 0) {
			const selected = filteredResults[cursorIndex];
			if (selected) handleUnifiedSelection(selected, 'roster');
			return;
		}

		if (input === 'G' && filteredResults.length > 0) {
			const selected = filteredResults[cursorIndex];
			if (selected) handleUnifiedSelection(selected, 'games');
			return;
		}

		// Alphanumeric and space input
		if (input && input.length === 1 && /[a-zA-Z0-9 ]/.test(input)) {
			setTeamSearchQuery(query + input);
			return;
		}

		if (key.backspace || key.delete) {
			if (query.length > 0) {
				setTeamSearchQuery(query.slice(0, -1));
			}
			return;
		}

		if (key.escape) {
			closeTeamSearch();
			return;
		}

		if (key.return && filteredResults.length > 0) {
			const selected = filteredResults[cursorIndex];
			if (selected) handleUnifiedSelection(selected);
			return;
		}

		if (key.downArrow && filteredResults.length > 0) {
			moveTeamSearchCursor(1, filteredResults.length - 1);
			return;
		}

		if (key.upArrow && filteredResults.length > 0) {
			moveTeamSearchCursor(-1, filteredResults.length - 1);
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
				<Text bold>Search Teams & Players</Text>
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
					<Text dimColor>Loading...</Text>
				) : playerCacheState.isLoading && query.trim() ? (
					<Text dimColor>Loading...</Text>
				) : filteredResults.length === 0 ? (
					<Text dimColor>No teams or players found</Text>
				) : (
					<Box flexDirection="column">
						{visibleResults.map((result, index) => {
							const absoluteIndex = start + index;
							const isSelected = absoluteIndex === cursorIndex;

							// Format differently for teams vs players
							const text =
								result.type === 'team'
									? `${result.team.teamAbbrev} - ${result.team.teamName}`
									: `${result.player.firstName.default} ${result.player.lastName.default} (#${result.player.jerseyNumber}, ${result.player.teamAbbrev})`;

							const padding = Math.max(0, lineWidth - text.length);
							const fullText = `${text}${' '.repeat(padding)}`;

							const key =
								result.type === 'team'
									? `${absoluteIndex}-team-${result.team.teamAbbrev}`
									: `${absoluteIndex}-player-${result.player.playerId}`;

							return (
								<Box key={key} minHeight={1}>
									<Text inverse={isSelected} dimColor={!isSelected}>
										{fullText}
									</Text>
								</Box>
							);
						})}
					</Box>
				)}
			</Box>

			{/* Footer hints */}
			<Box marginTop={1} borderStyle="single" borderTop>
				<Text dimColor>
					[↑↓] nav | [enter] {contextHint} | [shift+G] games | [shift+R] roster | [esc] close
				</Text>
			</Box>
		</Box>
	);
};

export default TeamSearchScreen;
