import { Box, Text } from "ink";
import type React from "react";
import type { GameListItem } from "@/data/api/client.js";

type ListProps = {
  items: GameListItem[];
  cursorIndex: number;
  height: number;
  onSelect?: (item: GameListItem) => void;
  loading?: boolean;
};

const List: React.FC<ListProps> = ({ items, cursorIndex, height, loading }) => {
  if (loading) {
    return <Text dimColor>Loading games...</Text>;
  }

  if (items.length === 0) {
    return <Text dimColor>No games found.</Text>;
  }

  const windowSize = Math.max(1, height - 2);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(items.length - windowSize, cursorIndex - half));
  const end = Math.min(items.length, start + windowSize);
  const visible = items.slice(start, end);

  return (
    <Box flexDirection="column">
      {visible.map((item, index) => {
        const absoluteIndex = start + index;
        const isSelected = absoluteIndex === cursorIndex;
        const awayWins = item.status === "final" && item.awayScore > item.homeScore;
        const homeWins = item.status === "final" && item.homeScore > item.awayScore;
        return (
          <Box key={item.id} justifyContent="space-between">
            <Text inverse={isSelected}>
              {item.awayTeam}{awayWins ? "*" : ""} @ {item.homeTeam}{homeWins ? "*" : ""}
            </Text>
            <Text inverse={isSelected}>{item.startTime}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default List;
