import { Box, Text } from "ink";
import type React from "react";

const Tabs: React.FC<{
  tabs: string[];
  active: string;
}> = ({ tabs, active }) => {
  return (
    <Box>
      {tabs.map((tab) => (
        <Box key={tab} marginRight={2}>
          <Text inverse={tab === active}>{tab}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default Tabs;
