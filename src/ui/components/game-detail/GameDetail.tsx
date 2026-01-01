import { Box, Text } from 'ink';
import React, { Fragment } from 'react';
import type { GameDetail as GameDetailType, StandingListItem } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import type { StandingsViewMode } from '@/state/useAppStore.js';
import GameHeader from '@/ui/components/game-detail/GameHeader.js';
import PlayersTab from '@/ui/components/game-detail/PlayersTab.js';
import PlaysTab from '@/ui/components/game-detail/PlaysTab.js';
import StatsTab from '@/ui/components/game-detail/StatsTab.js';
import Tabs from '@/ui/components/Tabs.js';

type GameDetailProps = {
	game: GameDetailType | null;
	status: 'loading' | 'error' | 'success';
	detailTab: 'stats' | 'plays' | 'players';
	playsScrollIndex: number;
	playersScrollIndex: number;
	playsSortOrder: 'asc' | 'desc';
	height: number;
	teamStandings?: { home: StandingListItem | null; away: StandingListItem | null } | null;
	standingsViewMode?: StandingsViewMode;
};

const GameDetail: React.FC<GameDetailProps> = ({
	game,
	status,
	detailTab,
	playsScrollIndex,
	playersScrollIndex,
	playsSortOrder,
	height,
	teamStandings,
	standingsViewMode = 'all',
}) => {
	const lineWidth = useLineWidth();

	if (status === 'loading' && !game) {
		return <Text dimColor>Loading game details...</Text>;
	}

	if (status === 'error') {
		return <Text color="red">Failed to load game details.</Text>;
	}

	if (!game) {
		return <Text dimColor>No details available.</Text>;
	}

	return (
		<Box flexDirection="column">
			<GameHeader
	      key={`game-${game.id}-header`}
				awayTeam={game.awayTeam}
				homeTeam={game.homeTeam}
				awayTeamAbbrev={game.awayTeamAbbrev}
				homeTeamAbbrev={game.homeTeamAbbrev}
				date={game.date}
				startTime={game.startTime}
				venue={game.venue}
				status={game.status}
				awayScore={game.awayScore}
				homeScore={game.homeScore}
				period={game.period}
				gameType={game.gameType}
				clock={game.clock}
				broadcasts={game.broadcasts}
			/>
			{game.status === 'scheduled' ? (
				<Fragment key={`game-${game.id}-scheduled-players`}>
					<Text dimColor>{'─'.repeat(lineWidth)}</Text>
					<PlayersTab game={game} scrollIndex={playersScrollIndex} height={height} />
				</Fragment>
			) : (
  			<Fragment key={`game-${game.id}-details-tabs`}>
          <Text dimColor>{'─'.repeat(lineWidth)}</Text>
  				<Box flexDirection="column">
  					<Tabs tabs={['stats', 'plays', 'players']} active={detailTab} />
            <Text dimColor>{'─'.repeat(lineWidth)}</Text>
  					<Box>
  						{detailTab === 'stats' ? (
  							<StatsTab
  								game={game}
  								teamStandings={teamStandings}
  								standingsViewMode={standingsViewMode}
  							/>
  						) : detailTab === 'plays' ? (
  							<PlaysTab
  								plays={game.plays}
  								scrollIndex={playsScrollIndex}
  								sortOrder={playsSortOrder}
  								height={height}
  							/>
  						) : (
  							<PlayersTab game={game} scrollIndex={playsScrollIndex} height={height} />
  						)}
  					</Box>
  				</Box>
  			</Fragment>
			)}
		</Box>
	);
};

export default GameDetail;
