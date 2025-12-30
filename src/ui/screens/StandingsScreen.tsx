import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useEffect, useMemo } from "react";
import { useStandings } from "../../data/hooks/useStandings.js";
import { useAppStore } from "../../state/useAppStore.js";
import { useAutoRefresh } from "../../hooks/useAutoRefresh.js";
import { queryClient } from "../../data/query/queryClient.js";
import { queryKeys } from "../../data/query/keys.js";
import StandingsList from "../components/StandingsList.js";
import StandingsDetail from "../components/standings-detail/StandingsDetail.js";
import SplitPane from "../components/SplitPane.js";
import StatusBar from "../components/StatusBar.js";
import Tabs from "../components/Tabs.js";

const StandingsScreen: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const height = stdout?.rows ?? 24;

  const {
    focusedPane,
    standingsCursorIndex,
    standingsTab,
    standingsConference,
    standingsDivision,
    moveStandingsCursor,
    setFocusedPane,
    setStandingsTab,
    setStandingsConference,
    setStandingsDivision,
    setViewMode,
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
        if (standingsTab === "conference" && key.downArrow && standingsConference === "eastern") {
          setStandingsConference("western");
        } else if (standingsTab === "division" && key.downArrow) {
          const divs: Array<"atlantic" | "metropolitan" | "central" | "pacific"> = [
            "atlantic",
            "metropolitan",
            "central",
            "pacific",
          ];
          const idx = divs.indexOf(standingsDivision);
          if (idx < divs.length - 1) {
            setStandingsDivision(divs[idx + 1]);
          }
        } else {
          moveStandingsCursor(1, Math.max(0, items.length - 1));
        }
        return;
      }
      if (input === "k" || key.upArrow) {
        if (standingsTab === "conference" && key.upArrow && standingsConference === "western") {
          setStandingsConference("eastern");
        } else if (standingsTab === "division" && key.upArrow) {
          const divs: Array<"atlantic" | "metropolitan" | "central" | "pacific"> = [
            "atlantic",
            "metropolitan",
            "central",
            "pacific",
          ];
          const idx = divs.indexOf(standingsDivision);
          if (idx > 0) {
            setStandingsDivision(divs[idx - 1]);
          }
        } else {
          moveStandingsCursor(-1, Math.max(0, items.length - 1));
        }
        return;
      }
      if (key.return) {
        setFocusedPane("detail");
        return;
      }
    }

    if (focusedPane === "detail") {
      if (input === "h" || key.leftArrow) {
        setFocusedPane("list");
        return;
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
    return <StandingsDetail team={selectedTeam} />;
  };

  const listPane = () => {
    if (status === "error") {
      return (
        <Box flexDirection="column" gap={1}>
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
      <Box flexDirection="column" gap={1}>
        <Text>{header}</Text>
        <Tabs tabs={["league", "conference", "division"]} active={standingsTab} />
        {subtabs.length > 0 && <Tabs tabs={subtabs} active={activeSubtab} />}
        <StandingsList items={items} cursorIndex={standingsCursorIndex} height={listHeight} loading={status === "loading"} />
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width} height={height} padding={1}>
      <Box flexGrow={1}>
        <SplitPane left={listPane()} right={detailPane()} />
      </Box>
      <Box marginTop={0} marginX={1}>
        <StatusBar focus={focusedPane} pageCursor={null} loading={status === "loading"} error={error instanceof Error ? error.message : null} />
      </Box>
    </Box>
  );
};

export default StandingsScreen;
