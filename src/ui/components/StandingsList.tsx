import { Box, Text, useStdout } from 'ink';
import type React from 'react';
import type { StandingListItem } from '@/data/api/client.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';
import type { StandingsViewMode } from '@/state/useAppStore.js';

type StandingsListProps = {
	items: StandingListItem[];
	cursorIndex: number;
	height: number;
	loading?: boolean;
	viewMode?: StandingsViewMode;
};

const StandingsList: React.FC<StandingsListProps> = ({
	items,
	cursorIndex,
	height,
	loading,
	viewMode = 'all',
}) => {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns || 80;
	const containerWidth = Math.floor(terminalWidth / 2) - 10;
	const { visible, start } = useWindowedList(items, cursorIndex, height, 6);

	if (loading) {
		return <Text dimColor>Loading standings...</Text>;
	}

	if (items.length === 0) {
		return <Text dimColor>No standings data available.</Text>;
	}

	const getRecord = (item: StandingListItem) => {
		if (viewMode === 'home') {
			return `${item.homeWins}-${item.homeLosses}-${item.homeOtLosses}`;
		}
		if (viewMode === 'road') {
			return `${item.roadWins}-${item.roadLosses}-${item.roadOtLosses}`;
		}
		return `${item.wins}-${item.losses}-${item.otLosses}`;
	};

	const getPoints = (item: StandingListItem) => {
		if (viewMode === 'home') return item.homePoints;
		if (viewMode === 'road') return item.roadPoints;
		return item.points;
	};

	return (
		<Box flexDirection="column">
			<Box minHeight={1}>
				<Box width={35}>
					<Text bold>Team</Text>
				</Box>
				<Box width={12}>
					<Text bold>W-L-OT</Text>
				</Box>
				<Box width={6}>
					<Text bold>PTS</Text>
				</Box>
			</Box>
			{visible.map((item, index) => {
				const absoluteIndex = start + index;
				const isSelected = absoluteIndex === cursorIndex;
				const record = getRecord(item);
				const points = getPoints(item);
				const teamText = `${item.rank}. ${item.teamName}`.padEnd(35);
				const recordText = record.padEnd(12);
				const pointsText = points.toString().padEnd(6);

				return (
					<Box key={`${absoluteIndex}-${item.teamAbbrev}`} minHeight={1}>
						<Text inverse={isSelected}>{teamText}{recordText}{pointsText}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default StandingsList;
