import { Box, Text } from "ink";
import type React from "react";
import type { StandingListItem } from "@/data/api/client.js";

type TeamInfoTabProps = {
  team: StandingListItem;
};

const TeamInfoTab: React.FC<TeamInfoTabProps> = ({ team }) => {
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>{team.teamName}</Text>
        <Text dimColor>
          {team.conferenceName} - {team.divisionName}
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text>
          Record: {team.wins}-{team.losses}-{team.otLosses}
        </Text>
        <Text>Points: {team.points}</Text>
        <Text>Games Played: {team.gamesPlayed}</Text>
        <Text>
          Streak: {team.streakCode}
          {team.streakCount}
        </Text>
      </Box>
    </Box>
  );
};

export default TeamInfoTab;
