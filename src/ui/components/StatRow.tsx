import { Box, Text } from "ink";
import type React from "react";

type StatRowProps = {
  label: string;
  awayValue: string | number;
  homeValue: string | number;
  labelWidth?: number;
  valueWidth?: number;
  isHeader?: boolean;
};

const StatRow: React.FC<StatRowProps> = ({
  label,
  awayValue,
  homeValue,
  labelWidth = 15,
  valueWidth = 12,
  isHeader = false,
}) => {
  return (
    <Box>
      <Box width={labelWidth}>
        <Text bold={isHeader}>{label}</Text>
      </Box>
      <Box width={valueWidth}>
        <Text bold={isHeader}>{awayValue}</Text>
      </Box>
      <Box width={valueWidth}>
        <Text bold={isHeader}>{homeValue}</Text>
      </Box>
    </Box>
  );
};

export default StatRow;
