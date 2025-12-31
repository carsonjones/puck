import { Box, Text } from 'ink';
import type React from 'react';
import type { PlayerDetailData } from '@/data/api/client.js';

type PlayerBioTabProps = {
	player: PlayerDetailData;
};

const PlayerBioTab: React.FC<PlayerBioTabProps> = ({ player }) => {
	const heightFeet = Math.floor(player.heightInInches / 12);
	const heightInches = player.heightInInches % 12;
	const heightStr = `${heightFeet}'${heightInches}"`;

	const birthPlace = player.birthStateProvince
		? `${player.birthCity}, ${player.birthStateProvince}, ${player.birthCountry}`
		: `${player.birthCity}, ${player.birthCountry}`;

	const age = Math.floor(
		(Date.now() - new Date(player.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
	);

	return (
		<Box flexDirection="column">
			<Text bold>Biographical Information</Text>
			<Box marginTop={1} flexDirection="column">
				<Box>
					<Box width={20}>
						<Text>Born:</Text>
					</Box>
					<Text>{birthPlace}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Birth Date:</Text>
					</Box>
					<Text>{`${player.birthDate} (Age ${age})`}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Height:</Text>
					</Box>
					<Text>{heightStr}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Weight:</Text>
					</Box>
					<Text>{`${player.weightInPounds} lbs`}</Text>
				</Box>
				<Box>
					<Box width={20}>
						<Text>Shoots/Catches:</Text>
					</Box>
					<Text>{player.shootsCatches}</Text>
				</Box>
			</Box>
		</Box>
	);
};

export default PlayerBioTab;
