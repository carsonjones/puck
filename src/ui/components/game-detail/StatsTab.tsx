import { Box, Text } from "ink";
import type React from "react";
import type { GameDetail } from "../../../data/api/client.js";

type StatsTabProps = {
  game: GameDetail;
};

const formatPct = (value: number) => (value > 0 ? `${value}%` : "n/a");

const StatsTab: React.FC<StatsTabProps> = ({ game }) => {
  return (
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
                  {leader.name} • {leader.goals}G {leader.assists}A {leader.points}P
                  {leader.hits > 0 ? ` • ${leader.hits} hits` : ""}
                  {leader.shots > 0 ? ` • ${leader.shots} SOG` : ""}
                </Text>
              ))}
            </Box>
          ) : null}
          {game.leaders.home.length > 0 ? (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>{game.homeTeam}</Text>
              {game.leaders.home.map((leader, idx) => (
                <Text key={idx}>
                  {leader.name} • {leader.goals}G {leader.assists}A {leader.points}P
                  {leader.hits > 0 ? ` • ${leader.hits} hits` : ""}
                  {leader.shots > 0 ? ` • ${leader.shots} SOG` : ""}
                </Text>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}
      {game.threeStars.length > 0 ? (
        <Box marginTop={1}>
          <Text>
            <Text bold>Three Stars:</Text> {game.threeStars.join(", ")}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};

export default StatsTab;
