import { Box, Text, useStdout } from "ink";
import type React from "react";
import type { GameDetail as GameDetailType } from "../../../data/api/client.js";
import Tabs from "../Tabs.js";
import GameHeader from "./GameHeader.js";
import PlaysTab from "./PlaysTab.js";
import PlayersTab from "./PlayersTab.js";
import StatsTab from "./StatsTab.js";

type GameDetailProps = {
  game: GameDetailType | null;
  status: "loading" | "error" | "success";
  detailTab: "stats" | "plays" | "players";
  playsScrollIndex: number;
  playsSortOrder: "asc" | "desc";
  height: number;
};

const GameDetail: React.FC<GameDetailProps> = ({
  game,
  status,
  detailTab,
  playsScrollIndex,
  playsSortOrder,
  height,
}) => {
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const lineWidth = Math.max(10, Math.floor(width / 2) - 14); // Half width minus padding/borders

  // Only show loading message if no data yet (initial load)
  if (status === "loading" && !game) {
    return <Text dimColor>Loading game details...</Text>;
  }

  if (status === "error" && !game) {
    return <Text color="red">Failed to load game details.</Text>;
  }

  if (!game) {
    return <Text dimColor>No details available.</Text>;
  }

  return (
    <Box flexDirection="column">
      <GameHeader
        awayTeam={game.awayTeam}
        homeTeam={game.homeTeam}
        date={game.date}
        startTime={game.startTime}
        venue={game.venue}
        status={game.status}
        awayScore={game.awayScore}
        homeScore={game.homeScore}
        period={game.period}
        gameType={game.gameType}
        clock={game.clock}
        broadcasts={game.broadcasts}
      />
      <Text dimColor>{"─".repeat(lineWidth)}</Text>
      {game.status !== "scheduled" ? (
        <Box flexDirection="column">
          <Tabs tabs={["stats", "plays", "players"]} active={detailTab} />
          <Text dimColor>{"─".repeat(lineWidth)}</Text>
          <Box>
            {detailTab === "stats" ? (
              <StatsTab game={game} />
            ) : detailTab === "plays" ? (
              <PlaysTab
                plays={game.plays}
                scrollIndex={playsScrollIndex}
                sortOrder={playsSortOrder}
                height={height}
              />
            ) : (
              <PlayersTab
                game={game}
                scrollIndex={playsScrollIndex}
                height={height}
              />
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default GameDetail;
