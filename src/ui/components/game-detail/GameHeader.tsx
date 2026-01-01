import { Box, Text } from 'ink';
import type React from 'react';
import { formatPeriod } from '@/data/nhl/formatters.js';

type GameHeaderProps = {
	awayTeam: string;
	homeTeam: string;
	awayTeamAbbrev?: string;
	homeTeamAbbrev?: string;
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
	awayTeamAbbrev,
	homeTeamAbbrev,
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
	const awayWins =
		status === 'final' &&
		awayScore !== undefined &&
		homeScore !== undefined &&
		awayScore > homeScore;
	const homeWins =
		status === 'final' &&
		awayScore !== undefined &&
		homeScore !== undefined &&
		homeScore > awayScore;

	const awayDisplay = awayTeam || awayTeamAbbrev || 'Away';
	const homeDisplay = homeTeam || homeTeamAbbrev || 'Home';

	return (
		<Box flexDirection="column">
			<Text>{`${awayDisplay}${awayWins ? ' ✓' : ''} @ ${homeDisplay}${homeWins ? ' ✓' : ''}`}</Text>
			{status !== 'scheduled' ? (
				<Box>
					<Text>{`Score: ${awayScore}-${homeScore}`}</Text>
					{status === 'final' ? <Text> (FINAL)</Text> : null}
					{period && period > 0 && gameType && (status !== 'final' || period > 3) ? (
						<Text> • {formatPeriod(period, gameType)}</Text>
					) : null}
					{clock && status !== 'final' ? <Text> • {clock}</Text> : null}
				</Box>
			) : null}
			<Text
				dimColor={['in_progress', 'final'].includes(status)}
			>{`${date} • ${startTime} • ${venue}`}</Text>
			{['in_progress', 'scheduled'].includes(status) && broadcasts?.length ? (
				<Text dimColor={true}>{`Broadcasts: ${broadcasts.join(', ')}`}</Text>
			) : null}
		</Box>
	);
};

export default GameHeader;
