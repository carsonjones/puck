import { Box, Text } from "ink";
import type React from "react";
import { useAppStore } from "@/state/useAppStore.js";

const StatusBar: React.FC<{
  focus: "list" | "detail";
  pageCursor: string | null;
  loading?: boolean;
  error?: string | null;
}> = ({ focus, loading, error }) => {
  const viewMode = useAppStore((state) => state.viewMode);
  const viewName = viewMode === "standings" ? "Standings" : viewMode === "players" ? "Players" : "Games";

  return (
    <Box justifyContent="space-between" width="100%">
      <Text>
        {viewName} | {focus === "list" ? "List" : "Detail"}
      </Text>
      <Text>
        {loading
          ? "Loading"
          : error
            ? `Error: ${error}`
            : "[c] calendar [w] standings [p] players [q] quit"}
      </Text>
    </Box>
  );
};

export default StatusBar;
