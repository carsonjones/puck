import { Box, Text, useStdout } from 'ink';
import React, { Fragment } from 'react';
import type { GameDetail as GameDetailType, StandingListItem } from '@/data/api/client.js';
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
	playsSortOrder,
	height,
	teamStandings,
	standingsViewMode = 'all',
}) => {
	const { stdout } = useStdout();
	const width = stdout?.columns ?? 80;
	const lineWidth = Math.max(1, Math.floor(width / 2) - 10); // Half width minus borders/margins

	// Only show loading message if no data yet (initial load)
	if (status === 'loading' && !game) {
		return <Text dimColor>Loading game details...</Text>;
	}

	if (status === 'error' && !game) {
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
			{game.status !== 'scheduled' ? (
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
			) : null}
		</Box>
	);
};

export default GameDetail;
