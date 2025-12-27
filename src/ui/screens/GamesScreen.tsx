import React, { useEffect, useMemo } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import SplitPane from "../components/SplitPane.js";
import List from "../components/List.js";
import StatusBar from "../components/StatusBar.js";
import Tabs from "../components/Tabs.js";
import { useAppStore } from "../../state/useAppStore.js";
import { useGamesPage } from "../../data/hooks/useGamesPage.js";
import { useGame } from "../../data/hooks/useGame.js";
import { queryClient } from "../../data/query/queryClient.js";
import { queryKeys } from "../../data/query/keys.js";

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
    moveCursor,
    selectGame,
    setFocusedPane,
    setPageCursor,
    setDetailTab,
  } = useAppStore();

  const { data, status, error, limit } = useGamesPage({ cursor: pageCursor, limit: 10 });
  const games = data?.items ?? [];
  const detail = useGame(selectedGameId);

  const listHeight = Math.max(6, height - 8);

  useEffect(() => {
    if (status !== "success" || games.length === 0) return;
    const clampedIndex = Math.min(listCursorIndex, games.length - 1);
    if (clampedIndex !== listCursorIndex) {
      moveCursor(0, games.length - 1);
      return;
    }
    const item = games[clampedIndex];
    if (item && item.id !== selectedGameId) {
      selectGame(item.id);
    }
  }, [status, games, listCursorIndex, moveCursor, selectGame, selectedGameId]);

  useEffect(() => {
    if (status !== "success" || games.length === 0) return;
    if (listCursorIndex !== 0) {
      moveCursor(-listCursorIndex, games.length - 1);
    }
  }, [pageCursor, status, games.length, listCursorIndex, moveCursor]);

  const resolveCursorDate = (value: string | null) => {
    const base = value ? new Date(value) : new Date();
    return Number.isNaN(base.getTime()) ? new Date() : base;
  };

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    if (input === "\t") {
      setFocusedPane(focusedPane === "list" ? "detail" : "list");
      return;
    }

    if (input === "r") {
      queryClient.invalidate(queryKeys.gamesList(pageCursor, limit));
      if (selectedGameId) queryClient.invalidate(queryKeys.gameDetail(selectedGameId));
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
      if (input === "1") setDetailTab("stats");
      if (input === "2") setDetailTab("plays");
    }
  });

  const header = useMemo(() => {
    if (status === "loading") return "Loading games";
    if (status === "error") return "Games";
    return `Games (${games.length})`;
  }, [status, games.length]);

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
        <Text>
          {game.awayTeam} @ {game.homeTeam}
        </Text>
        <Text>
          {game.date} • {game.startTime} • {game.venue}
        </Text>
        <Text>
          Score: {game.awayScore}-{game.homeScore} ({game.status.replace("_", " ")})
        </Text>
        {game.clock ? <Text>Clock: {game.clock}</Text> : null}
        {game.broadcasts.length > 0 ? (
          <Text>Broadcasts: {game.broadcasts.join(", ")}</Text>
        ) : null}
        <Tabs tabs={["stats", "plays"]} active={detailTab} />
        {detailTab === "stats" ? (
          <Box flexDirection="column">
            <Text>
              Shots: {game.stats.shots.away} (A) vs {game.stats.shots.home} (H)
            </Text>
            <Text>
              Hits: {game.stats.hits.away} (A) vs {game.stats.hits.home} (H)
            </Text>
            <Text>
              Faceoff %: {formatPct(game.stats.faceoffPct.away)} (A) vs {formatPct(game.stats.faceoffPct.home)} (H)
            </Text>
            {game.leaders.away.length > 0 || game.leaders.home.length > 0 ? (
              <Box flexDirection="column" marginTop={1}>
                <Text>Leaders:</Text>
                {game.leaders.away.length > 0 ? <Text>  Away: {game.leaders.away.join(", ")}</Text> : null}
                {game.leaders.home.length > 0 ? <Text>  Home: {game.leaders.home.join(", ")}</Text> : null}
              </Box>
            ) : null}
            {game.threeStars.length > 0 ? <Text>Three Stars: {game.threeStars.join(", ")}</Text> : null}
          </Box>
        ) : (
          <Box flexDirection="column">
            {game.plays.map((play) => (
              <Text key={`${play.time}-${play.description}`}>
                {play.time} {play.description}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={width} padding={1}>
      <SplitPane
        left={
          <Box flexDirection="column" gap={1}>
            <Text>{header}</Text>
            <List items={games} cursorIndex={listCursorIndex} height={listHeight} loading={status === "loading"} />
          </Box>
        }
        right={detailPane()}
      />
      <Box marginTop={1}>
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
