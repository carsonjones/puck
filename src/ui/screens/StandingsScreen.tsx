import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useEffect, useMemo } from "react";
import { useStandings } from "@/data/hooks/useStandings.js";
import { queryKeys } from "@/data/query/keys.js";
import { queryClient } from "@/data/query/queryClient.js";
import { useAutoRefresh } from "@/hooks/useAutoRefresh.js";
import { useAppStore } from "@/state/useAppStore.js";
import SplitPane from "@/ui/components/SplitPane.js";
import StandingsList from "@/ui/components/StandingsList.js";
import StatusBar from "@/ui/components/StatusBar.js";
import StandingsDetail from "@/ui/components/standings-detail/StandingsDetail.js";
import Tabs from "@/ui/components/Tabs.js";
import { useTeamRosterData } from "@/ui/components/standings-detail/useTeamRosterData.js";

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
    moveStandingsCursor,
    setFocusedPane,
    setStandingsTab,
    moveStandingsPlayersScroll,
    setStandingsConference,
    setStandingsDivision,
    setViewMode,
    selectPlayer,
    setPreviousStandingsState,
  } = useAppStore();

  const listHeight = Math.max(6, height - 4);
  const { data, status, error } = useStandings();

  // Determine which list to show based on tab
  const items = useMemo(() => {
    if (!data) return [];

    if (standingsTab === "league") {
      return data.league;
    } else if (standingsTab === "conference") {
      return standingsConference === "eastern" ? data.eastern : data.western;
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

  const quit = () => {
    exit();
    const isWatchMode =
      process.env.TSX_WATCH === "true" ||
      process.env.TSX_WATCH === "1" ||
      Boolean(process.env.TSX_WATCH_PATH) ||
      Boolean(process.env.TSX_WATCH_MODE);
    if (isWatchMode) {
      try {
        process.kill(process.ppid, "SIGINT");
      } catch {
        // Ignore errors if the parent process is already gone.
      }
    }
    process.exit(0);
  };

  // Key bindings
  useInput((input, key) => {
    resetTimer();

    if (input.toLowerCase() === "q" || (key.ctrl && input === "c")) {
      quit();
      return;
    }

    if (input === "c") {
      setViewMode("games");
      return;
    }

    if (input === "w") {
      setViewMode("standings");
      return;
    }

    if (key.escape) {
      setFocusedPane("list");
      return;
    }

    if (input === "\t" || key.tab) {
      if (focusedPane === "list") {
        // Cycle through subtabs when in list pane
        if (standingsTab === "conference") {
          setStandingsConference(standingsConference === "eastern" ? "western" : "eastern");
          return;
        } else if (standingsTab === "division") {
          const divs: Array<"atlantic" | "metropolitan" | "central" | "pacific"> = [
            "atlantic",
            "metropolitan",
            "central",
            "pacific",
          ];
          const idx = divs.indexOf(standingsDivision);
          const nextDiv = divs[(idx + 1) % divs.length];
          if (nextDiv) setStandingsDivision(nextDiv);
          return;
        }
      }
      // Switch panes if in league tab or in detail pane
      setFocusedPane(focusedPane === "list" ? "detail" : "list");
      return;
    }

    if (input === "r") {
      queryClient.invalidate(queryKeys.standings());
      return;
    }

    // Tab switching
    if (input === "1") {
      setStandingsTab("league");
      return;
    }
    if (input === "2") {
      setStandingsTab("conference");
      return;
    }
    if (input === "3") {
      setStandingsTab("division");
      return;
    }

    if (focusedPane === "list") {
      if (input === "j" || key.downArrow) {
        moveStandingsCursor(1, Math.max(0, items.length - 1));
        return;
      }
      if (input === "k" || key.upArrow) {
        moveStandingsCursor(-1, Math.max(0, items.length - 1));
        return;
      }
      if (input === "l" || key.rightArrow || key.return) {
        setFocusedPane("detail");
        return;
      }
    }

    if (focusedPane === "detail") {
      if (input === "h" || key.leftArrow) {
        setFocusedPane("list");
        return;
      }

      if (selectedTeam) {
        if (input === "j" || key.downArrow) {
          moveStandingsPlayersScroll(1, 999);
          return;
        }
        if (input === "k" || key.upArrow) {
          moveStandingsPlayersScroll(-1);
          return;
        }
        if (key.return) {
          // Make sure roster data is loaded
          if (roster.loading || (!roster.players.length && !roster.goalies.length)) {
            return;
          }

          const allRoster = [...roster.players, ...roster.goalies];
          const selectedPlayer = allRoster[standingsPlayersScrollIndex];

          if (selectedPlayer) {
            setPreviousStandingsState({
              teamAbbrev: selectedTeam.teamAbbrev,
              playerIndex: standingsPlayersScrollIndex,
            });
            selectPlayer(selectedPlayer.id);
            setFocusedPane("detail"); // Focus on detail pane to show the player immediately
            setViewMode("players");
          }
          return;
        }
      }
    }
  });

  const header = useMemo(() => {
    if (status === "loading") return "Loading standings";
    if (status === "error") return "Standings";

    if (standingsTab === "league") return "League Standings";
    if (standingsTab === "conference") {
      return `${standingsConference === "eastern" ? "Eastern" : "Western"} Conference`;
    }
    return `${standingsDivision.charAt(0).toUpperCase() + standingsDivision.slice(1)} Division`;
  }, [status, standingsTab, standingsConference, standingsDivision]);

  const detailPane = () => {
    return <StandingsDetail team={selectedTeam} height={height} />;
  };

  const listPane = () => {
    const lineWidth = Math.max(10, Math.floor(width / 2) - 14); // Half width minus padding/borders

    if (status === "error") {
      return (
        <Box flexDirection="column">
          <Text>{header}</Text>
          <Box flexDirection="column" paddingTop={2}>
            <Text color="red">Failed to load standings</Text>
            <Text dimColor>{error instanceof Error ? error.message : "Unknown error"}</Text>
          </Box>
        </Box>
      );
    }

    let subtabs: string[] = [];
    let activeSubtab = "";
    if (standingsTab === "conference") {
      subtabs = ["eastern", "western"];
      activeSubtab = standingsConference;
    } else if (standingsTab === "division") {
      subtabs = ["atlantic", "metropolitan", "central", "pacific"];
      activeSubtab = standingsDivision;
    }

    return (
      <Box flexDirection="column">
        <Box minHeight={1}>
          <Text>{header}</Text>
        </Box>
        <Text dimColor>{"─".repeat(lineWidth)}</Text>
        <Tabs tabs={["league", "conference", "division"]} active={standingsTab} />
        {subtabs.length > 0 && <Tabs tabs={subtabs} active={activeSubtab} />}
        <Box marginTop={1}>
          <StandingsList items={items} cursorIndex={standingsCursorIndex} height={listHeight} loading={status === "loading"} />
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width} height={height} padding={1}>
      <Box flexGrow={1}>
        <SplitPane left={listPane()} right={detailPane()} />
      </Box>
      <StatusBar focus={focusedPane} pageCursor={null} loading={status === "loading"} error={error instanceof Error ? error.message : null} />
    </Box>
  );
};

export default StandingsScreen;
