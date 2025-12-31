import { Box, Text } from "ink";
import type React from "react";

const Tabs: React.FC<{
  tabs: string[];
  active: string;
}> = ({ tabs, active }) => {
  return (
    <Box flexDirection="row" minHeight={1}>
      {tabs.map((tab) => (
        <Box key={tab} marginRight={2}>
          <Text inverse={tab === active}>{`${tab?.slice(0, 1).toUpperCase()}${tab?.slice(1)}`}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default Tabs;
