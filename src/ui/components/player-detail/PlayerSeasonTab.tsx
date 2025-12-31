import { Box, Text } from 'ink';
import type React from 'react';
import type { PlayerDetailData } from '@/data/api/client.js';

type PlayerSeasonTabProps = {
	player: PlayerDetailData;
};

const PlayerSeasonTab: React.FC<PlayerSeasonTabProps> = ({ player }) => {
	if (!player.seasonStats) {
		return <Text dimColor>No season stats available.</Text>;
	}

	const stats = player.seasonStats;

	return (
		<Box flexDirection="column">
			<Text bold>2024-25 Regular Season</Text>
			<Box marginTop={1} flexDirection="column">
				<Box>
					<Box width={20}>
						<Text>Games Played:</Text>
					</Box>
					<Text>{stats.gamesPlayed}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Goals:</Text>
					</Box>
					<Text>{stats.goals}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Assists:</Text>
					</Box>
					<Text>{stats.assists}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Points:</Text>
					</Box>
					<Text>{stats.points}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>+/-:</Text>
					</Box>
					<Text>{stats.plusMinus >= 0 ? `+${stats.plusMinus}` : stats.plusMinus}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>PIM:</Text>
					</Box>
					<Text>{stats.pim}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Shots:</Text>
					</Box>
					<Text>{stats.shots}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Shooting %:</Text>
					</Box>
					<Text>{stats.shootingPctg.toFixed(1)}%</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>PP Goals:</Text>
					</Box>
					<Text>{stats.ppGoals}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>SH Goals:</Text>
					</Box>
					<Text>{stats.shGoals}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>GW Goals:</Text>
					</Box>
					<Text>{stats.gwGoals}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Avg TOI:</Text>
					</Box>
					<Text>{stats.avgToi}</Text>
				</Box>
			</Box>
		</Box>
	);
};

export default PlayerSeasonTab;
