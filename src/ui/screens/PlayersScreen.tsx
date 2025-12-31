import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useEffect, useMemo } from "react";
import { usePlayersLeaderboard } from "@/data/hooks/usePlayersLeaderboard.js";
import { usePlayerDetail } from "@/data/hooks/usePlayerDetail.js";
import { queryKeys } from "@/data/query/keys.js";
import { queryClient } from "@/data/query/queryClient.js";
import { useAutoRefresh } from "@/hooks/useAutoRefresh.js";
import { useAppStore } from "@/state/useAppStore.js";
import SplitPane from "@/ui/components/SplitPane.js";
import PlayersList from "@/ui/components/PlayersList.js";
import PlayerDetail from "@/ui/components/player-detail/PlayerDetail.js";
import StatusBar from "@/ui/components/StatusBar.js";
import TeamSearchScreen from "@/ui/screens/TeamSearchScreen.js";

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
    playerDetailScrollIndex,
    teamSearchOpen,
    movePlayersCursor,
    selectPlayer,
    setFocusedPane,
    setPlayerDetailTab,
    movePlayerDetailScroll,
    setViewMode,
    openTeamSearch,
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

  // Auto-select player based on cursor or sync cursor to selected player
  useEffect(() => {
    if (status !== "success") return;
    if (items.length === 0) {
      if (selectedPlayerId !== null) selectPlayer(null);
      return;
    }

    // If a player is already selected (e.g., from team roster), move cursor to that player
    if (selectedPlayerId !== null) {
      const playerIndex = items.findIndex((p) => p.id === selectedPlayerId);
      if (playerIndex >= 0 && playerIndex !== playersCursorIndex) {
        movePlayersCursor(playerIndex - playersCursorIndex, items.length - 1);
        return;
      }
    }

    // Otherwise, select the player at cursor position
    const clampedIndex = Math.min(playersCursorIndex, items.length - 1);
    if (clampedIndex !== playersCursorIndex) {
      movePlayersCursor(0, items.length - 1);
      return;
    }
    const item = items[clampedIndex];
    if (item && item.id !== selectedPlayerId) {
      selectPlayer(item.id);
    }
  }, [status, items, playersCursorIndex, selectedPlayerId, selectPlayer, movePlayersCursor]);

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
    if (input === "/" || (key.ctrl && input === "t")) {
      openTeamSearch();
      return;
    }

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

    if (input === "p") {
      setViewMode("players");
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
      queryClient.invalidate(queryKeys.playersLeaderboard());
      if (selectedPlayerId) {
        queryClient.invalidate(queryKeys.playerDetail(selectedPlayerId));
        queryClient.invalidate(queryKeys.playerGameLog(selectedPlayerId));
      }
      return;
    }

    // Tab switching for detail view
    if (input === "1") {
      setPlayerDetailTab("season");
      return;
    }
    if (input === "2") {
      setPlayerDetailTab("games");
      return;
    }
    if (input === "3") {
      setPlayerDetailTab("bio");
      return;
    }

    if (focusedPane === "list") {
      if (input === "j" || key.downArrow) {
        movePlayersCursor(1, Math.max(0, items.length - 1));
        return;
      }
      if (input === "k" || key.upArrow) {
        movePlayersCursor(-1, Math.max(0, items.length - 1));
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

      // Scrolling in games tab
      if (playerDetailTab === "games") {
        if (input === "j" || key.downArrow) {
          movePlayerDetailScroll(1, 999);
          return;
        }
        if (input === "k" || key.upArrow) {
          movePlayerDetailScroll(-1);
          return;
        }
      }
    }
  });

  const header = useMemo(() => {
    if (status === "loading") return "Loading players";
    if (status === "error") return "Players";
    return `Top Scorers (${items.length})`;
  }, [status, items.length]);

  const detailPane = () => {
    const status = playerDetail.status === "idle" ? "loading" : playerDetail.status;
    return (
      <PlayerDetail
        player={playerDetail.data ?? null}
        status={status}
        height={height}
      />
    );
  };

  const listPane = () => {
    const lineWidth = Math.max(10, Math.floor(width / 2) - 14);

    if (status === "error") {
      return (
        <Box flexDirection="column">
          <Text>{header}</Text>
          <Box flexDirection="column" paddingTop={2}>
            <Text color="red">Failed to load players</Text>
            <Text dimColor>{error instanceof Error ? error.message : "Unknown error"}</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Box minHeight={1}>
          <Text>{header}</Text>
        </Box>
        <Text dimColor>{"─".repeat(lineWidth)}</Text>
        <Box marginTop={1}>
          <PlayersList
            items={items}
            cursorIndex={playersCursorIndex}
            height={listHeight}
            loading={status === "loading"}
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
        loading={status === "loading"}
        error={error instanceof Error ? error.message : null}
      />
    </Box>
  );
};

export default PlayersScreen;
