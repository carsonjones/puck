import { Box, Text, useApp, useStdout } from "ink";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDetail as GameDetailType } from "../../data/api/client.js";
import { useGame } from "../../data/hooks/useGame.js";
import { useGamesPage } from "../../data/hooks/useGamesPage.js";
import { useAppStore } from "../../state/useAppStore.js";
import { useKeyBindings } from "../../hooks/useKeyBindings.js";
import { useAutoRefresh } from "../../hooks/useAutoRefresh.js";
import { queryClient } from "../../data/query/queryClient.js";
import { queryKeys } from "../../data/query/keys.js";
import GameDetail from "../components/game-detail/GameDetail.js";
import List from "../components/List.js";
import SplitPane from "../components/SplitPane.js";
import StatusBar from "../components/StatusBar.js";

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
    moveCursor,
    selectGame,
    setFocusedPane,
    setPageCursor,
    setDetailTab,
    movePlaysScroll,
    togglePlaysSortOrder,
  } = useAppStore();

  const listHeight = Math.max(6, height - 4);
  const { data, status, error, limit } = useGamesPage({ cursor: pageCursor, limit: listHeight });
  const games = useMemo(() => data?.items ?? [], [data]);
  const detail = useGame(selectedGameId);

  // Local state for game data - updated field by field to minimize re-renders
  const [displayGame, setDisplayGame] = useState<GameDetailType | null>(null);
  const [displayStatus, setDisplayStatus] = useState<"loading" | "error" | "success">("loading");

  // Update display state field by field when data changes
  useEffect(() => {
    if (detail.status === "success" && detail.data) {
      if (!displayGame) {
        // Initial load - set everything
        setDisplayGame(detail.data);
        setDisplayStatus("success");
      } else {
        // Incremental update - only change fields that differ
        const updates: Partial<GameDetailType> = {};
        let hasChanges = false;

        // Check each field
        if (detail.data.homeScore !== displayGame.homeScore) {
          updates.homeScore = detail.data.homeScore;
          hasChanges = true;
        }
        if (detail.data.awayScore !== displayGame.awayScore) {
          updates.awayScore = detail.data.awayScore;
          hasChanges = true;
        }
        if (detail.data.period !== displayGame.period) {
          updates.period = detail.data.period;
          hasChanges = true;
        }
        if (detail.data.clock !== displayGame.clock) {
          updates.clock = detail.data.clock;
          hasChanges = true;
        }
        if (detail.data.status !== displayGame.status) {
          updates.status = detail.data.status;
          hasChanges = true;
        }
        if (JSON.stringify(detail.data.plays) !== JSON.stringify(displayGame.plays)) {
          updates.plays = detail.data.plays;
          hasChanges = true;
        }
        if (JSON.stringify(detail.data.stats) !== JSON.stringify(displayGame.stats)) {
          updates.stats = detail.data.stats;
          hasChanges = true;
        }
        if (JSON.stringify(detail.data.leaders) !== JSON.stringify(displayGame.leaders)) {
          updates.leaders = detail.data.leaders;
          hasChanges = true;
        }
        if (JSON.stringify(detail.data.boxscore) !== JSON.stringify(displayGame.boxscore)) {
          updates.boxscore = detail.data.boxscore;
          hasChanges = true;
        }

        if (hasChanges) {
          setDisplayGame({ ...displayGame, ...updates });
        }
      }
    } else if (detail.status === "loading" && !displayGame) {
      // Only set loading if we don't have data yet
      setDisplayStatus("loading");
    } else if (detail.status === "error" && !displayGame) {
      setDisplayStatus("error");
    }
  }, [detail.status, detail.data, displayGame]);

  // Reset display state when game changes
  useEffect(() => {
    setDisplayGame(null);
    setDisplayStatus("loading");
  }, [selectedGameId]);

  // Determine refresh interval based on game status
  const refreshIntervalMs = useMemo(() => {
    if (!selectedGameId || !displayGame) return 0;
    const gameStatus = displayGame.status;
    if (gameStatus === "in_progress") return 5_000; // 5s for live games
    if (gameStatus === "final") return 30_000; // 30s for completed games
    return 30_000; // 30s for scheduled games
  }, [selectedGameId, displayGame?.status]);

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

  useEffect(() => {
    if (status !== "success") return;
    if (games.length === 0) {
      if (selectedGameId !== null) selectGame(null);
      return;
    }
    const clampedIndex = Math.min(listCursorIndex, games.length - 1);
    if (clampedIndex !== listCursorIndex) {
      moveCursor(0, games.length - 1);
      return;
    }
    const item = games[clampedIndex];
    if (item && item.id !== selectedGameId) {
      selectGame(item.id, item.status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, games, listCursorIndex, selectedGameId]);

  const previousCursor = useRef<string | null>(pageCursor);

  useEffect(() => {
    if (status !== "success" || games.length === 0) return;
    if (previousCursor.current !== pageCursor) {
      moveCursor(-listCursorIndex, games.length - 1);
      previousCursor.current = pageCursor;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCursor, status, games.length]);

  const previousGameId = useRef<string | null>(null);
  const previousTab = useRef<string | null>(null);

  useEffect(() => {
    if (previousGameId.current !== selectedGameId || previousTab.current !== detailTab) {
      if (previousGameId.current !== null || previousTab.current !== null) {
        useAppStore.setState({ playsScrollIndex: 0 });
      }
      previousGameId.current = selectedGameId;
      previousTab.current = detailTab;
    }
  }, [selectedGameId, detailTab]);

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

  const playsCount =
    detailTab === "plays" && displayGame?.plays
      ? displayGame.plays.length
      : detailTab === "players" && displayGame?.boxscore
      ? [
          ...(displayGame.boxscore.playerByGameStats.awayTeam.forwards || []),
          ...(displayGame.boxscore.playerByGameStats.awayTeam.defense || []),
          ...(displayGame.boxscore.playerByGameStats.awayTeam.goalies || []),
          ...(displayGame.boxscore.playerByGameStats.homeTeam.forwards || []),
          ...(displayGame.boxscore.playerByGameStats.homeTeam.defense || []),
          ...(displayGame.boxscore.playerByGameStats.homeTeam.goalies || []),
        ].length + 3
      : 0;

  useKeyBindings({
    focusedPane,
    detailTab,
    games,
    listCursorIndex,
    pageCursor,
    selectedGameId,
    data: data ?? null,
    limit,
    playsCount,
    onQuit: quit,
    moveCursor,
    selectGame,
    setFocusedPane,
    setPageCursor,
    setDetailTab,
    movePlaysScroll,
    togglePlaysSortOrder,
    onInteraction: resetTimer,
  });

  const header = useMemo(() => {
    if (status === "loading") return "Loading games";
    if (status === "error") return "Games";
    const dateStr = pageCursor || new Date().toISOString().slice(0, 10);
    return `Games for ${dateStr} (${games.length})`;
  }, [status, games.length, pageCursor]);

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
        playsSortOrder={playsSortOrder}
        height={height}
      />
    );
  };

  const listPane = () => {
    if (status === "error") {
      return (
        <Box flexDirection="column" gap={1}>
          <Text>{header}</Text>
          <Box flexDirection="column" paddingTop={2}>
            <Text color="red">Failed to load games</Text>
            <Text dimColor>{error instanceof Error ? error.message : "Unknown error"}</Text>
            <Box marginTop={1}>
              <Text dimColor>Press 'q' to quit</Text>
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text>{header}</Text>
        <List items={games} cursorIndex={listCursorIndex} height={listHeight} loading={status === "loading"} />
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width} height={height} padding={1}>
      <Box flexGrow={1}>
        <SplitPane
          left={listPane()}
          right={detailPane()}
        />
      </Box>
      <Box marginTop={0} marginX={1}>
        <StatusBar
          focus={focusedPane}
          pageCursor={pageCursor}
          loading={status === "loading"}
          error={error instanceof Error ? error.message : null}
        />
      </Box>
    </Box>
  );
};

export default GamesScreen;
