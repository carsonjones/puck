import { Box, Text } from 'ink';
import type React from 'react';
import type { GameDetail } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { useWindowedList } from '@/hooks/useWindowedList.js';
import { useAppStore } from '@/state/useAppStore.js';
import TeamPlayersTab from '@/ui/components/standings-detail/TeamPlayersTab.js';
import Tabs from '@/ui/components/Tabs.js';

type PlayersTabProps = {
	game: GameDetail;
	scrollIndex: number;
	height: number;
};

type PlayerRow = {
	type: 'player' | 'header';
	number?: number;
	name: string;
	position?: string;
	goals?: number;
	assists?: number;
	shots?: number;
	hits?: number;
	saves?: number;
	savePct?: number;
	isGoalie?: boolean;
};

const PlayersTab: React.FC<PlayersTabProps> = ({ game, scrollIndex, height }) => {
	const lineWidth = useLineWidth();
	const { playersTeamTab, playersScrollIndex } = useAppStore();

	// Build player data early for hook
	const awayPlayers: PlayerRow[] = game.boxscore
		? [
				...(game.boxscore?.playerByGameStats?.awayTeam?.forwards.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					goals: p.goals,
					assists: p.assists,
					shots: p.sog,
					hits: p.hits,
					isGoalie: false,
				})) || []),
				...(game.boxscore?.playerByGameStats?.awayTeam?.defense.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					goals: p.goals,
					assists: p.assists,
					shots: p.sog,
					hits: p.hits,
					isGoalie: false,
				})) || []),
				...(game.boxscore?.playerByGameStats?.awayTeam?.goalies.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					saves: p.saves,
					savePct: p.savePctg,
					isGoalie: true,
				})) || []),
			]
		: [];

	const homePlayers: PlayerRow[] = game.boxscore
		? [
				...(game.boxscore?.playerByGameStats?.homeTeam?.forwards.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					goals: p.goals,
					assists: p.assists,
					shots: p.sog,
					hits: p.hits,
					isGoalie: false,
				})) || []),
				...(game.boxscore?.playerByGameStats?.homeTeam?.defense.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					goals: p.goals,
					assists: p.assists,
					shots: p.sog,
					hits: p.hits,
					isGoalie: false,
				})) || []),
				...(game.boxscore?.playerByGameStats?.homeTeam?.goalies.map((p) => ({
					type: 'player' as const,
					number: p.sweaterNumber,
					name: p.name.default,
					position: p.position,
					saves: p.saves,
					savePct: p.savePctg,
					isGoalie: true,
				})) || []),
			]
		: [];

	const allPlayers = game.boxscore
		? [
				{ type: 'header' as const, name: game.awayTeam },
				...awayPlayers,
				{ type: 'header' as const, name: '' },
				{ type: 'header' as const, name: game.homeTeam },
				...homePlayers,
			]
		: [];

	const { visible: visiblePlayers, start } = useWindowedList(allPlayers, scrollIndex, height, 15);

	if (game.status === 'scheduled') {
		const teamAbbrev = playersTeamTab === 'away' ? game.awayTeamAbbrev : game.homeTeamAbbrev;
		const activeTeam = playersTeamTab === 'away' ? game.awayTeam : game.homeTeam;

		// Account for: GameHeader (4 lines) + separator + tabs + separator + StatusBar + padding
		const adjustedHeight = Math.max(8, height - 6);

		return (
			<Box flexDirection="column">
				<Tabs tabs={[game.awayTeam, game.homeTeam]} active={activeTeam} />
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
				<TeamPlayersTab
					teamAbbrev={teamAbbrev}
					scrollIndex={playersScrollIndex}
					height={adjustedHeight}
					compact={true}
				/>
			</Box>
		);
	}

	// In-progress or final games - show stats (only shown after initial load)
	if (!game.boxscore && (game.status === 'in_progress' || game.status === 'final')) {
		return <Text dimColor>No player stats available.</Text>;
	}

	return (
		<Box flexDirection="column">
			<Box>
				<Text bold>
					{`${'  '}${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'Pos'.padEnd(4)} ${'G'.padEnd(3)} ${'A'.padEnd(3)} ${'PTS'.padEnd(4)} ${'SOG'.padEnd(4)} ${'HTS'.padEnd(4)} ${'SV'.padEnd(4)} ${'SV%'}`}
				</Text>
			</Box>
			{visiblePlayers.map((player, idx) => {
				const absoluteIndex = start + idx;
				const isSelected = absoluteIndex === scrollIndex;

				if (player.type === 'header') {
					return (
						<Box key={absoluteIndex}>
							<Text bold dimColor={player.name === ''}>
								{player.name === '' ? '' : player.name}
							</Text>
						</Box>
					);
				}

				const displayNum = String(player.number).padEnd(4);
				const displayName = player.name.slice(0, 20).padEnd(20);
				const displayPos = (player.position || '').padEnd(4);

				if (player.isGoalie) {
					const displaySaves = String(player.saves ?? 0).padEnd(4);
					const displaySavePct = player.savePct ? `${(player.savePct * 100).toFixed(1)}%` : 'n/a';
					const text = `${'  '}${displayNum} ${displayName} ${displayPos} ${'-'.padEnd(3)} ${'-'.padEnd(3)} ${'-'.padEnd(4)} ${'-'.padEnd(4)} ${'-'.padEnd(4)} ${displaySaves} ${displaySavePct}`;
					const padding = Math.max(0, lineWidth - text.length);
					const fullText = `${text}${' '.repeat(padding)}`;
					return (
						<Box key={absoluteIndex}>
							<Text inverse={isSelected}>{fullText}</Text>
						</Box>
					);
				}

				const displayGoals = String(player.goals ?? 0).padEnd(3);
				const displayAssists = String(player.assists ?? 0).padEnd(3);
				const displayPoints = String((player.goals ?? 0) + (player.assists ?? 0)).padEnd(4);
				const displayShots = String(player.shots ?? 0).padEnd(4);
				const displayHits = String(player.hits ?? 0).padEnd(4);

				const text = `${'  '}${displayNum} ${displayName} ${displayPos} ${displayGoals} ${displayAssists} ${displayPoints} ${displayShots} ${displayHits} ${'-'.padEnd(4)} ${'-'}`;
				const padding = Math.max(0, lineWidth - text.length);
				const fullText = `${text}${' '.repeat(padding)}`;
				return (
					<Box key={absoluteIndex}>
						<Text inverse={isSelected}>{fullText}</Text>
					</Box>
				);
			})}
		</Box>
	);
};

export default PlayersTab;
