import { Box, Text } from "ink";
import type React from "react";
import type { GameDetail as GameDetailType } from "../../../data/api/client.js";
import Tabs from "../Tabs.js";
import GameHeader from "./GameHeader.js";
import PlaysTab from "./PlaysTab.js";
import StatsTab from "./StatsTab.js";

type GameDetailProps = {
  game: GameDetailType | null;
  status: "loading" | "error" | "success";
  detailTab: "stats" | "plays";
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
  if (status === "loading") {
    return <Text dimColor>Loading game details...</Text>;
  }

  if (status === "error") {
    return <Text color="red">Failed to load game details.</Text>;
  }

  if (!game) {
    return <Text dimColor>No details available.</Text>;
  }

  return (
    <Box flexDirection="column" gap={1}>
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
      {game.status !== "scheduled" ? (
        <>
          <Tabs tabs={["stats", "plays"]} active={detailTab} />
          {detailTab === "stats" ? (
            <StatsTab game={game} />
          ) : (
            <PlaysTab
              plays={game.plays}
              scrollIndex={playsScrollIndex}
              sortOrder={playsSortOrder}
              height={height}
            />
          )}
        </>
      ) : null}
    </Box>
  );
};

export default GameDetail;
