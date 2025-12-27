import React from "react";
import { Box } from "ink";

const SplitPane: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number;
}> = ({ left, right, leftWidth = 45 }) => {
  return (
    <Box flexDirection="row" width="100%">
      <Box width={`${leftWidth}%`} flexDirection="column" borderStyle="round" paddingX={1}>
        {left}
      </Box>
      <Box flexGrow={1} marginLeft={1} flexDirection="column" borderStyle="round" paddingX={1}>
        {right}
      </Box>
    </Box>
  );
};

export default SplitPane;
