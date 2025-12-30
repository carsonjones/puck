import { Box, Text } from "ink";
import type React from "react";
import { useTeamRosterData } from "@/ui/components/standings-detail/useTeamRosterData.js";

type TeamPlayersTabProps = {
  teamAbbrev: string;
  scrollIndex: number;
  height: number;
};

const TeamPlayersTab: React.FC<TeamPlayersTabProps> = ({ teamAbbrev, scrollIndex, height }) => {
  const { players, loading, error } = useTeamRosterData(teamAbbrev);

  if (loading) {
    return <Text dimColor>Loading roster...</Text>;
  }

  if (error) {
    return <Text color="red">Failed to load roster.</Text>;
  }

  if (players.length === 0) {
    return <Text dimColor>No roster data available.</Text>;
  }

  const playersHeight = Math.max(5, height - 10);
  const windowSize = Math.max(1, playersHeight);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(players.length - windowSize, scrollIndex - half));
  const end = Math.min(players.length, start + windowSize);
  const visiblePlayers = players.slice(start, end);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>
          {"  "}{"#".padEnd(4)} {"Name".padEnd(20)} {"Pos".padEnd(4)} {"GP".padEnd(4)} {"G".padEnd(3)} {"A".padEnd(3)} {"Pts".padEnd(4)} {"+/-".padEnd(4)} {"SOG".padEnd(4)} {"SH%"}
        </Text>
      </Box>
      {visiblePlayers.map((player, idx) => {
        const absoluteIndex = start + idx;
        const isSelected = absoluteIndex === scrollIndex;

        const displayNum = String(player.sweaterNumber).padEnd(4);
        const displayName = `${player.firstName.charAt(0)}. ${player.lastName}`.slice(0, 20).padEnd(20);
        const displayPos = player.positionCode.padEnd(4);
        const displayGP = String(player.gamesPlayed).padEnd(4);
        const displayGoals = String(player.goals).padEnd(3);
        const displayAssists = String(player.assists).padEnd(3);
        const displayPoints = String(player.points).padEnd(4);
        const displayPlusMinus = (player.plusMinus >= 0 ? "+" : "") + String(player.plusMinus).padEnd(3);
        const displayShots = String(player.shots).padEnd(4);
        const displayShootingPct = player.shootingPctg > 0 ? player.shootingPctg.toFixed(1) + "%" : "0.0%";

        return (
          <Box key={absoluteIndex}>
            <Text color={isSelected ? "cyan" : undefined}>
              {isSelected ? "> " : "  "}
              {displayNum} {displayName} {displayPos} {displayGP} {displayGoals} {displayAssists} {displayPoints} {displayPlusMinus} {displayShots} {displayShootingPct}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default TeamPlayersTab;
