import { Box, Text, useApp, useInput, useStdout } from "ink";
import { useEffect, useMemo, useRef } from "react";
import { useGame } from "../../data/hooks/useGame.js";
import { useGamesPage } from "../../data/hooks/useGamesPage.js";
import { formatPeriod } from "../../data/nhl/formatters.js";
import { queryKeys } from "../../data/query/keys.js";
import { queryClient } from "../../data/query/queryClient.js";
import { useAppStore } from "../../state/useAppStore.js";
import List from "../components/List.js";
import SplitPane from "../components/SplitPane.js";
import StatusBar from "../components/StatusBar.js";
import Tabs from "../components/Tabs.js";

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
      selectGame(item.id);
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

  const resolveCursorDate = (value: string | null) => {
    const base = value ? new Date(value) : new Date();
    return Number.isNaN(base.getTime()) ? new Date() : base;
  };

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

  useInput((input, key) => {
    if (input.toLowerCase() === "q" || (key.ctrl && input === "c")) {
      quit();
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
      queryClient.invalidate(queryKeys.gamesList(pageCursor, limit));
      if (selectedGameId) queryClient.invalidate(queryKeys.gameDetail(selectedGameId));
      return;
    }

    if (input === "1") {
      setDetailTab("stats");
      return;
    }
    if (input === "2") {
      setDetailTab("plays");
      return;
    }

    if (focusedPane === "list") {
      if (input === "j" || key.downArrow) {
        moveCursor(1, Math.max(0, games.length - 1));
        return;
      }
      if (input === "k" || key.upArrow) {
        moveCursor(-1, Math.max(0, games.length - 1));
        return;
      }
      if (key.return) {
        const item = games[listCursorIndex];
        if (item) {
          selectGame(item.id);
          setFocusedPane("detail");
        }
        return;
      }
      if (key.leftArrow) {
        const current = resolveCursorDate(pageCursor);
        const prev = new Date(current);
        prev.setDate(prev.getDate() - 1);
        setPageCursor(prev.toISOString().slice(0, 10));
        return;
      }
      if (key.rightArrow && data?.nextCursor) {
        setPageCursor(data.nextCursor);
        return;
      }
    }

    if (focusedPane === "detail") {
      if (input === "h" || key.leftArrow) {
        setFocusedPane("list");
        return;
      }
      if (input === "s") {
        togglePlaysSortOrder();
        return;
      }
      if (detailTab === "plays" && detail.data?.plays && detail.data.plays.length > 0) {
        const playsCount = detail.data.plays.length;
        if (input === "j" || key.downArrow) {
          movePlaysScroll(1, playsCount - 1);
          return;
        }
        if (input === "k" || key.upArrow) {
          movePlaysScroll(-1, playsCount - 1);
          return;
        }
      }
    }
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

    if (detail.status === "loading") {
      return <Text dimColor>Loading game details...</Text>;
    }

    if (detail.status === "error") {
      return <Text color="red">Failed to load game details.</Text>;
    }

    if (!detail.data) {
      return <Text dimColor>No details available.</Text>;
    }

    const game = detail.data;

    const formatPct = (value: number) => (value > 0 ? `${value}%` : "n/a");

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text>
            {game.awayTeam} @ {game.homeTeam}
          </Text>
          <Text>
            {game.date} • {game.startTime} • {game.venue}
          </Text>
        </Box>
{game.status !== "scheduled" ? (
          <Box>
            <Text>Score: {game.awayScore}-{game.homeScore}</Text>
            {game.status === "final" ? <Text> (FINAL)</Text> : null}
            {game.period > 0 ? (
              <Text> • {formatPeriod(game.period, game.gameType)}</Text>
            ) : null}
            {game.clock ? <Text> • {game.clock}</Text> : null}
          </Box>
        ) : null}
        {game.broadcasts.length > 0 ? (
          <Text>Broadcasts: {game.broadcasts.join(", ")}</Text>
        ) : null}
        {game.status !== "scheduled" ? (
          <>
            <Tabs tabs={["stats", "plays"]} active={detailTab} />
            {detailTab === "stats" ? (
              <Box flexDirection="column">
            <Box>
              <Box width={15} />
              <Box width={20}>
                <Text bold>{game.awayTeam}</Text>
              </Box>
              <Box width={20}>
                <Text bold>{game.homeTeam}</Text>
              </Box>
            </Box>
            <Box>
              <Box width={15}>
                <Text>Shots</Text>
              </Box>
              <Box width={20}>
                <Text>{game.stats.shots.away}</Text>
              </Box>
              <Box width={20}>
                <Text>{game.stats.shots.home}</Text>
              </Box>
            </Box>
            <Box>
              <Box width={15}>
                <Text>Hits</Text>
              </Box>
              <Box width={20}>
                <Text>{game.stats.hits.away}</Text>
              </Box>
              <Box width={20}>
                <Text>{game.stats.hits.home}</Text>
              </Box>
            </Box>
            <Box>
              <Box width={15}>
                <Text>Faceoff %</Text>
              </Box>
              <Box width={20}>
                <Text>{formatPct(game.stats.faceoffPct.away)}</Text>
              </Box>
              <Box width={20}>
                <Text>{formatPct(game.stats.faceoffPct.home)}</Text>
              </Box>
            </Box>
            {game.leaders.away.length > 0 || game.leaders.home.length > 0 ? (
              <Box flexDirection="column" marginTop={1}>
                <Text bold>Leaders</Text>
                {game.leaders.away.length > 0 ? (
                  <Box flexDirection="column" marginTop={1}>
                    <Text bold>{game.awayTeam}</Text>
                    {game.leaders.away.map((leader, idx) => (
                      <Text key={idx}>
                        {leader.name} • {leader.goals}G {leader.assists}A {leader.points}P{leader.hits > 0 ? ` • ${leader.hits} hits` : ""}{leader.shots > 0 ? ` • ${leader.shots} SOG` : ""}
                      </Text>
                    ))}
                  </Box>
                ) : null}
                {game.leaders.home.length > 0 ? (
                  <Box flexDirection="column" marginTop={1}>
                    <Text bold>{game.homeTeam}</Text>
                    {game.leaders.home.map((leader, idx) => (
                      <Text key={idx}>
                        {leader.name} • {leader.goals}G {leader.assists}A {leader.points}P{leader.hits > 0 ? ` • ${leader.hits} hits` : ""}{leader.shots > 0 ? ` • ${leader.shots} SOG` : ""}
                      </Text>
                    ))}
                  </Box>
                ) : null}
              </Box>
            ) : null}
            {game.threeStars.length > 0 ? <Box marginTop={1}><Text><Text bold>Three Stars:</Text> {game.threeStars.join(", ")}</Text></Box> : null}
          </Box>
        ) : (
          <Box flexDirection="column">
            {(() => {
              const sortedPlays = playsSortOrder === "desc" ? [...game.plays].reverse() : game.plays;
              const playsHeight = Math.max(5, height - 15);
              const windowSize = Math.max(1, playsHeight);
              const half = Math.floor(windowSize / 2);
              const start = Math.max(0, Math.min(sortedPlays.length - windowSize, playsScrollIndex - half));
              const end = Math.min(sortedPlays.length, start + windowSize);
              const visiblePlays = sortedPlays.slice(start, end);
              return visiblePlays.map((play, idx) => {
                const absoluteIndex = start + idx;
                const isSelected = absoluteIndex === playsScrollIndex;
                return (
                  <Box key={absoluteIndex}>
                    <Text color={isSelected ? "cyan" : undefined}>
                      {isSelected ? "> " : "  "}{play.time} {play.description}
                    </Text>
                  </Box>
                );
              });
            })()}
          </Box>
            )}
          </>
        ) : null}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width} height={height} padding={1}>
      <Box flexGrow={1}>
        <SplitPane
          left={
            <Box flexDirection="column" gap={1}>
              <Text>{header}</Text>
              <List items={games} cursorIndex={listCursorIndex} height={listHeight} loading={status === "loading"} />
            </Box>
          }
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
