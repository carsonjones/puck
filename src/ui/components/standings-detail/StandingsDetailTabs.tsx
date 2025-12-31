import { Box, Text, useStdout } from "ink";
import type React from "react";
import type { StandingListItem } from "@/data/api/client.js";
import { useAppStore } from "@/state/useAppStore.js";
import TeamPlayersTab from "@/ui/components/standings-detail/TeamPlayersTab.js";

type StandingsDetailTabsProps = {
  team: StandingListItem | null;
  height: number;
};

const StandingsDetailTabs: React.FC<StandingsDetailTabsProps> = ({ team, height }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const lineWidth = Math.max(10, Math.floor(width / 2) - 14);

  const { standingsPlayersScrollIndex } = useAppStore();

  if (!team) {
    return <Text dimColor>Select a team to view details.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>{team.teamName}</Text>
        <Text dimColor>
          {team.conferenceName} - {team.divisionName}
        </Text>
        <Text>
          {team.wins}-{team.losses}-{team.otLosses} ({team.points} pts)
        </Text>
      </Box>
      {/*<Text dimColor>{"─".repeat(lineWidth)}</Text>*/}
      <TeamPlayersTab
        teamAbbrev={team.teamAbbrev}
        scrollIndex={standingsPlayersScrollIndex}
        height={height}
      />
    </Box>
  );
};

export default StandingsDetailTabs;
