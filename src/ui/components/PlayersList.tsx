import { Box, Text } from 'ink';
import type React from 'react';
import type { PlayerLeaderboardItem } from '@/data/api/client.js';

type PlayersListProps = {
	items: PlayerLeaderboardItem[];
	cursorIndex: number;
	height: number;
	loading?: boolean;
};

const PlayersList: React.FC<PlayersListProps> = ({ items, cursorIndex, height, loading }) => {
	if (loading) {
		return <Text dimColor>Loading players...</Text>;
	}

	if (items.length === 0) {
		return <Text dimColor>No player data available.</Text>;
	}

	const windowSize = Math.max(1, height - 6);
	const half = Math.floor(windowSize / 2);
	const start = Math.max(0, Math.min(items.length - windowSize, cursorIndex - half));
	const end = Math.min(items.length, start + windowSize);
	const visible = items.slice(start, end);

	return (
		<Box flexDirection="column">
			<Box minHeight={1}>
				<Box width={5}>
					<Text bold>Rank</Text>
				</Box>
				<Box width={25}>
					<Text bold>Player</Text>
				</Box>
				<Box width={8}>
					<Text bold>Team</Text>
				</Box>
				<Box width={6}>
					<Text bold>Pos</Text>
				</Box>
				<Box width={6}>
					<Text bold>Pts</Text>
				</Box>
			</Box>
			{visible.map((item, index) => {
				const absoluteIndex = start + index;
				const isSelected = absoluteIndex === cursorIndex;
				const name = `${item.firstName.charAt(0)}. ${item.lastName}`;

				return (
					<Box key={`${absoluteIndex}-${item.id}`} minHeight={1}>
						<Box width={5}>
							<Text inverse={isSelected}>{absoluteIndex + 1}.</Text>
						</Box>
						<Box width={25}>
							<Text inverse={isSelected}>{name}</Text>
						</Box>
						<Box width={8}>
							<Text inverse={isSelected}>{item.teamAbbrev}</Text>
						</Box>
						<Box width={6}>
							<Text inverse={isSelected}>{item.position}</Text>
						</Box>
						<Box width={6}>
							<Text inverse={isSelected}>{item.points}</Text>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlayersList;
