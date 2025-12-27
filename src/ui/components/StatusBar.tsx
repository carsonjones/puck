import React from "react";
import { Box, Text } from "ink";

const StatusBar: React.FC<{
  focus: "list" | "detail";
  pageCursor: string | null;
  loading?: boolean;
  error?: string | null;
}> = ({ focus, pageCursor, loading, error }) => {
  return (
    <Box justifyContent="space-between" width="100%">
      <Text>
        Focus: {focus === "list" ? "List" : "Detail"} | Page: {pageCursor ?? "0"}
      </Text>
      <Text>
        {loading
          ? "Loading"
          : error
            ? `Error: ${error}`
            : "j/k move • enter select • tab focus • 1/2 tabs • r retry • q quit"}
      </Text>
    </Box>
  );
};

export default StatusBar;
