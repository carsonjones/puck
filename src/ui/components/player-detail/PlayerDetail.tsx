import { Text } from 'ink';
import type React from 'react';
import type { PlayerDetailData } from '@/data/api/client.js';
import PlayerDetailTabs from '@/ui/components/player-detail/PlayerDetailTabs.js';

type PlayerDetailProps = {
	player: PlayerDetailData | null;
	status: 'loading' | 'error' | 'success';
	height: number;
};

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, status, height }) => {
	if (!player) {
		if (status === 'loading') {
			return <Text dimColor>Loading player details...</Text>;
		}
		if (status === 'error') {
			return <Text color="red">Failed to load player details.</Text>;
		}
		return <Text dimColor>Select a player to view details.</Text>;
	}

	return <PlayerDetailTabs player={player} height={height} />;
};

export default PlayerDetail;
