import { Box, Text, useStdout } from "ink";
import type React from "react";
import type { GameDetail as GameDetailType, StandingListItem } from "@/data/api/client.js";
import type { StandingsViewMode } from "@/state/useAppStore.js";
import Tabs from "@/ui/components/Tabs.js";
import GameHeader from "@/ui/components/game-detail/GameHeader.js";
import PlaysTab from "@/ui/components/game-detail/PlaysTab.js";
import PlayersTab from "@/ui/components/game-detail/PlayersTab.js";
import StatsTab from "@/ui/components/game-detail/StatsTab.js";

type GameDetailProps = {
  game: GameDetailType | null;
  status: "loading" | "error" | "success";
  detailTab: "stats" | "plays" | "players";
  playsScrollIndex: number;
  playsSortOrder: "asc" | "desc";
  height: number;
  teamStandings?: { home: StandingListItem | null; away: StandingListItem | null } | null;
  standingsViewMode?: StandingsViewMode;
};

const GameDetail: React.FC<GameDetailProps> = ({
  game,
  status,
  detailTab,
  playsScrollIndex,
  playsSortOrder,
  height,
  teamStandings,
  standingsViewMode = "all",
}) => {
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const lineWidth = Math.max(10, Math.floor(width / 2) - 10); // Half width minus borders/margins

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
      {game.status !== "scheduled" ? (
        <Box flexDirection="column" marginTop={1}>
          <Tabs tabs={["stats", "plays", "players"]} active={detailTab} />
          <Box>
            {detailTab === "stats" ? (
              <StatsTab game={game} teamStandings={teamStandings} standingsViewMode={standingsViewMode} />
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
