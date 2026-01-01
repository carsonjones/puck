import { Box, Text } from 'ink';
import type React from 'react';
import type { PlayerDetailData } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { useAppStore } from '@/state/useAppStore.js';
import PlayerBioTab from '@/ui/components/player-detail/PlayerBioTab.js';
import PlayerGamesTab from '@/ui/components/player-detail/PlayerGamesTab.js';
import PlayerSeasonTab from '@/ui/components/player-detail/PlayerSeasonTab.js';
import Tabs from '@/ui/components/Tabs.js';
import { getFullPositionName, getFullTeamName } from '@/utils/nhlUtils.js';

type PlayerDetailTabsProps = {
	player: PlayerDetailData;
	height: number;
};

const PlayerDetailTabs: React.FC<PlayerDetailTabsProps> = ({ player, height }) => {
	const { playerDetailTab, playerDetailScrollIndex } = useAppStore();
	const lineWidth = useLineWidth();

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" marginBottom={1}>
				<Text bold>{`${player.firstName} ${player.lastName} #${player.sweaterNumber}`}</Text>
				<Text
					dimColor
				>{`${getFullTeamName(player.teamAbbrev)} • ${getFullPositionName(player.position)}`}</Text>
			</Box>
			<Text dimColor>{'─'.repeat(lineWidth)}</Text>
			<Tabs tabs={['season', 'about', 'games']} active={playerDetailTab} />
			<Text dimColor>{'─'.repeat(lineWidth)}</Text>
			<Box>
				{playerDetailTab === 'season' ? (
					<PlayerSeasonTab player={player} />
				) : playerDetailTab === 'games' ? (
					<PlayerGamesTab
						playerId={player.id}
						scrollIndex={playerDetailScrollIndex}
						height={height}
					/>
				) : (
					<PlayerBioTab player={player} />
				)}
			</Box>
		</Box>
	);
};

export default PlayerDetailTabs;
