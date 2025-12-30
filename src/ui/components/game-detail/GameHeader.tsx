import { Box, Text } from "ink";
import type React from "react";
import { formatPeriod } from "@/data/nhl/formatters.js";

type GameHeaderProps = {
  awayTeam: string;
  homeTeam: string;
  date: string;
  startTime: string;
  venue: string;
  status: string;
  awayScore?: number;
  homeScore?: number;
  period?: number;
  gameType?: number;
  clock?: string;
  broadcasts: string[];
};

const GameHeader: React.FC<GameHeaderProps> = ({
  awayTeam,
  homeTeam,
  date,
  startTime,
  venue,
  status,
  awayScore,
  homeScore,
  period,
  gameType,
  clock,
  broadcasts,
}) => {
  return (
    <Box flexDirection="column">
      <Text>
        {awayTeam} @ {homeTeam}
      </Text>
      <Text>
        {date} • {startTime} • {venue}
      </Text>
      {status !== "scheduled" ? (
        <Box>
          <Text>
            Score: {awayScore}-{homeScore}
          </Text>
          {status === "final" ? <Text> (FINAL)</Text> : null}
          {period && period > 0 && gameType && (status !== "final" || period > 3) ? (
            <Text> • {formatPeriod(period, gameType)}</Text>
          ) : null}
          {clock && status !== "final" ? <Text> • {clock}</Text> : null}
        </Box>
      ) : null}
      {broadcasts.length > 0 ? <Text>Broadcasts: {broadcasts.join(", ")}</Text> : null}
    </Box>
  );
};

export default GameHeader;
