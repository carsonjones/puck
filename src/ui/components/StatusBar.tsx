import { Box, Text } from "ink";
import type React from "react";

const StatusBar: React.FC<{
  focus: "list" | "detail";
  pageCursor: string | null;
  loading?: boolean;
  error?: string | null;
}> = ({ focus, loading, error }) => {
  return (
    <Box justifyContent="space-between" width="100%">
      <Text>
        {focus === "list" ? "List" : "Detail"}
      </Text>
      <Text>
        {loading
          ? "Loading"
          : error
            ? `Error: ${error}`
            : 												"[q] quit"}
      </Text>
    </Box>
  );
};

export default StatusBar;
