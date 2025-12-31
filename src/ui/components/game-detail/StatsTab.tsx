import { Box, Text } from "ink";
import type React from "react";
import type { GameDetail } from "@/data/api/client.js";
import StatRow from "@/ui/components/StatRow.js";

type StatsTabProps = {
  game: GameDetail;
};

const formatPct = (value: number) => (value > 0 ? `${value}%` : "n/a");

const StatsTab: React.FC<StatsTabProps> = ({ game }) => {
  return (
    <Box flexDirection="column">
      <StatRow label="" awayValue={game.awayTeam} homeValue={game.homeTeam} isHeader />
      <StatRow label="Goals" awayValue={game.awayScore} homeValue={game.homeScore} />
      <StatRow label="Shots" awayValue={game.stats.shots.away} homeValue={game.stats.shots.home} />
      <StatRow label="Hits" awayValue={game.stats.hits.away} homeValue={game.stats.hits.home} />
      <StatRow
        label="Faceoff %"
        awayValue={formatPct(game.stats.faceoffPct.away)}
        homeValue={formatPct(game.stats.faceoffPct.home)}
      />
      {game.leaders.away.length > 0 || game.leaders.home.length > 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Leaders</Text>
          {game.leaders.away.length > 0 ? (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>{game.awayTeam}</Text>
              {game.leaders.away.map((leader, idx) => (
                <Text key={idx}>{`  ${leader}`}</Text>
              ))}
            </Box>
          ) : null}
          {game.leaders.home.length > 0 ? (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>{game.homeTeam}</Text>
              {game.leaders.home.map((leader, idx) => (
                <Text key={idx}>{`  ${leader}`}</Text>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}
      {game.threeStars.length > 0 ? (
        <Box marginTop={1}>
          <Text>
            <Text bold>{"Three Stars:"}</Text>{` ${game.threeStars.join(", ")}`}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};

export default StatsTab;
