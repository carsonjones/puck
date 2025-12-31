import { Box, Text, useInput, useStdout } from "ink";
import { useMemo } from "react";
import type { StandingListItem } from "@/data/api/client.js";
import { useStandings } from "@/data/hooks/useStandings.js";
import { useAppStore } from "@/state/useAppStore.js";
import { fuzzyMatchTeams } from "@/utils/fuzzyMatch.js";

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
    setStandingsConference,
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
  const listHeight = height - 6; // Account for header, input, footer
  const half = Math.floor(listHeight / 2);
  const start = Math.max(0, Math.min(filteredTeams.length - listHeight, cursorIndex - half));
  const end = Math.min(filteredTeams.length, start + listHeight);
  const visibleTeams = filteredTeams.slice(start, end);

  const handleTeamSelection = (team: StandingListItem, action: "context" | "roster") => {
    if (action === "roster") {
      // Always go to standings detail for roster
      navigateToTeamInStandings(team, "detail");
    } else {
      // Context-aware action
      if (viewMode === "games") {
        setGameTeamFilter(team.teamAbbrev);
        setViewMode("games");
        setFocusedPane("list");
      } else if (viewMode === "standings") {
        navigateToTeamInStandings(team, "list");
      } else {
        // Default: go to standings
        navigateToTeamInStandings(team, "list");
      }
    }
    closeTeamSearch();
  };

  const navigateToTeamInStandings = (team: StandingListItem, focusPane: "list" | "detail") => {
    // Determine correct tab/subtab for team
    if (team.conferenceName === "Eastern") {
      setStandingsTab("conference");
      setStandingsConference("eastern");
    } else if (team.conferenceName === "Western") {
      setStandingsTab("conference");
      setStandingsConference("western");
    }

    // Find team index in league-wide list
    const teamIndex = allTeams.findIndex((t) => t.teamAbbrev === team.teamAbbrev);

    if (teamIndex >= 0) {
      // Move cursor to team position
      const delta = teamIndex - standingsCursorIndex;
      moveStandingsCursor(delta, allTeams.length - 1);
    }

    setViewMode("standings");
    setFocusedPane(focusPane);
  };

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      closeTeamSearch();
      return;
    }

    if (key.return && filteredTeams.length > 0) {
      handleTeamSelection(filteredTeams[cursorIndex], "context");
      return;
    }

    if (key.ctrl && input === "d" && filteredTeams.length > 0) {
      handleTeamSelection(filteredTeams[cursorIndex], "roster");
      return;
    }

    if ((input === "j" || key.downArrow) && filteredTeams.length > 0) {
      moveTeamSearchCursor(1, filteredTeams.length - 1);
      return;
    }

    if ((input === "k" || key.upArrow) && filteredTeams.length > 0) {
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
  let contextHint = "select";
  if (viewMode === "games") {
    contextHint = "filter games";
  } else if (viewMode === "standings") {
    contextHint = "jump to team";
  }

  const lineWidth = Math.max(20, width - 4);

  return (
    <Box flexDirection="column" width={width} height={height} padding={1}>
      {/* Header */}
      <Box flexDirection="column">
        <Text bold>Search Teams</Text>
        <Text dimColor>{"─".repeat(lineWidth)}</Text>
      </Box>

      {/* Search input */}
      <Box marginTop={1} marginBottom={1}>
        <Text>Query: </Text>
        <Text color="cyan">{query || "(type to search)"}</Text>
        {query && <Text>█</Text>}
      </Box>

      {/* Results list */}
      <Box flexDirection="column" flexGrow={1}>
        {status === "pending" ? (
          <Text dimColor>Loading teams...</Text>
        ) : filteredTeams.length === 0 ? (
          <Text dimColor>No teams found</Text>
        ) : (
          <>
            <Text dimColor>
              {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""} found
            </Text>
            <Box marginTop={1} flexDirection="column">
              {visibleTeams.map((team, index) => {
                const absoluteIndex = start + index;
                const isSelected = absoluteIndex === cursorIndex;
                return (
                  <Text key={team.teamAbbrev} inverse={isSelected}>
                    {team.teamAbbrev} - {team.teamName}
                  </Text>
                );
              })}
            </Box>
          </>
        )}
      </Box>

      {/* Footer hints */}
      <Box marginTop={1} borderStyle="single" borderTop>
        <Text dimColor>
          [↑↓/jk] navigate | [Enter] {contextHint} | [Ctrl+D] roster | [Esc] close
        </Text>
      </Box>
    </Box>
  );
};

export default TeamSearchScreen;
