import { Box, Text } from "ink";
import type React from "react";
import type { StandingListItem } from "@/data/api/client.js";
import type { StandingsViewMode } from "@/state/useAppStore.js";

type StandingsListProps = {
  items: StandingListItem[];
  cursorIndex: number;
  height: number;
  loading?: boolean;
  viewMode?: StandingsViewMode;
};

const StandingsList: React.FC<StandingsListProps> = ({ items, cursorIndex, height, loading, viewMode = "all" }) => {
  if (loading) {
    return <Text dimColor>Loading standings...</Text>;
  }

  if (items.length === 0) {
    return <Text dimColor>No standings data available.</Text>;
  }

  const windowSize = Math.max(1, height - 6);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(items.length - windowSize, cursorIndex - half));
  const end = Math.min(items.length, start + windowSize);
  const visible = items.slice(start, end);

  const getRecord = (item: StandingListItem) => {
    if (viewMode === "home") {
      return `${item.homeWins}-${item.homeLosses}-${item.homeOtLosses}`;
    }
    if (viewMode === "road") {
      return `${item.roadWins}-${item.roadLosses}-${item.roadOtLosses}`;
    }
    return `${item.wins}-${item.losses}-${item.otLosses}`;
  };

  const getPoints = (item: StandingListItem) => {
    if (viewMode === "home") return item.homePoints;
    if (viewMode === "road") return item.roadPoints;
    return item.points;
  };

  return (
    <Box flexDirection="column">
      <Box minHeight={1}>
        <Box width={25}>
          <Text bold>Team</Text>
        </Box>
        <Box width={12}>
          <Text bold>W-L-OT</Text>
        </Box>
        <Box width={6}>
          <Text bold>PTS</Text>
        </Box>
      </Box>
      {visible.map((item, index) => {
        const absoluteIndex = start + index;
        const isSelected = absoluteIndex === cursorIndex;
        const record = getRecord(item);
        const points = getPoints(item);
        return (
          <Box key={`${absoluteIndex}-${item.teamAbbrev}`} minHeight={1}>
            <Box width={25}>
              <Text inverse={isSelected}>
                {item.rank}. {item.teamName}
              </Text>
            </Box>
            <Box width={12}>
              <Text inverse={isSelected}>{record}</Text>
            </Box>
            <Box width={6}>
              <Text inverse={isSelected}>{points}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default StandingsList;
