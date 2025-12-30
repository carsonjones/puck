import { Box, Text } from "ink";
import type React from "react";
import type { StandingListItem } from "../../data/api/client.js";

type StandingsListProps = {
  items: StandingListItem[];
  cursorIndex: number;
  height: number;
  loading?: boolean;
};

const StandingsList: React.FC<StandingsListProps> = ({ items, cursorIndex, height, loading }) => {
  if (loading) {
    return <Text dimColor>Loading standings...</Text>;
  }

  if (items.length === 0) {
    return <Text dimColor>No standings data available.</Text>;
  }

  const windowSize = Math.max(1, height - 2);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(items.length - windowSize, cursorIndex - half));
  const end = Math.min(items.length, start + windowSize);
  const visible = items.slice(start, end);

  return (
    <Box flexDirection="column">
      <Box>
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
        const record = `${item.wins}-${item.losses}-${item.otLosses}`;
        return (
          <Box key={item.teamAbbrev}>
            <Box width={25}>
              <Text inverse={isSelected}>
                {item.rank}. {item.teamName}
              </Text>
            </Box>
            <Box width={12}>
              <Text inverse={isSelected}>{record}</Text>
            </Box>
            <Box width={6}>
              <Text inverse={isSelected}>{item.points}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default StandingsList;
