import { Box, Text } from 'ink';
import type React from 'react';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { useTeamRosterData } from '@/ui/components/standings-detail/useTeamRosterData.js';

type TeamPlayersTabProps = {
	teamAbbrev: string;
	scrollIndex: number;
	height: number;
	compact?: boolean;
};

const TeamPlayersTab: React.FC<TeamPlayersTabProps> = ({ teamAbbrev, scrollIndex, height, compact = false }) => {
	const lineWidth = useLineWidth();
	const { players, goalies, loading, error } = useTeamRosterData(teamAbbrev);

	if (loading) {
		return <Text dimColor>Loading roster...</Text>;
	}

	if (error) {
		return <Text color="red">Failed to load roster.</Text>;
	}

	if (players.length === 0 && goalies.length === 0) {
		return <Text dimColor>No roster data available.</Text>;
	}

	const totalRoster = players.length + goalies.length;
	const playersHeight = Math.max(5, height - 10);
	const windowSize = Math.max(1, playersHeight);
	const half = Math.floor(windowSize / 2);
	const start = Math.max(0, Math.min(totalRoster - windowSize, scrollIndex - half));
	const end = Math.min(totalRoster, start + windowSize);

	// Determine which players and goalies are visible
	const visiblePlayersStart = Math.max(0, start);
	const visiblePlayersEnd = Math.min(players.length, end);
	const visibleGoaliesStart = Math.max(0, start - players.length);
	const visibleGoaliesEnd = Math.max(0, end - players.length);

	const visiblePlayers = players.slice(visiblePlayersStart, visiblePlayersEnd);
	const visibleGoalies = goalies.slice(visibleGoaliesStart, visibleGoaliesEnd);

	const showPlayersHeader = visiblePlayers.length > 0;
	const showGoaliesHeader = visibleGoalies.length > 0;

	return (
		<Box flexDirection="column">
			{showPlayersHeader && (
				<>
					<Box>
						<Text bold>
							{compact
								? `${'  '}${'#'.padEnd(3)} ${'Name'.padEnd(15)} ${'Pos'.padEnd(3)} ${'GP'.padStart(3)} ${'G'.padStart(2)} ${'A'.padStart(2)} ${'Pts'.padStart(3)} ${'+/-'.padStart(3)}`
								: `${'  '}${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'Pos'.padEnd(4)} ${'GP'.padStart(4)} ${'G'.padStart(3)} ${'A'.padStart(3)} ${'Pts'.padStart(4)} ${'+/-'.padStart(4)} ${'SOG'.padStart(4)} ${'SH%'.padStart(5)}`
							}
						</Text>
					</Box>
					{visiblePlayers.map((player, idx) => {
						const absoluteIndex = visiblePlayersStart + idx;
						const isSelected = absoluteIndex === scrollIndex;

						const nameLen = compact ? 15 : 20;
						const displayNum = compact ? String(player.sweaterNumber ?? '').padEnd(3) : String(player.sweaterNumber ?? '').padEnd(4);
						const displayName = `${player.firstName.charAt(0)}. ${player.lastName}`
							.slice(0, nameLen)
							.padEnd(nameLen);
						const displayPos = compact ? player.positionCode.padEnd(3) : player.positionCode.padEnd(4);
						const displayGP = compact ? String(player.gamesPlayed).padStart(3) : String(player.gamesPlayed).padStart(4);
						const displayGoals = compact ? String(player.goals).padStart(2) : String(player.goals).padStart(3);
						const displayAssists = compact ? String(player.assists).padStart(2) : String(player.assists).padStart(3);
						const displayPoints = compact ? String(player.points).padStart(3) : String(player.points).padStart(4);
						const displayPlusMinus = compact
							? ((player.plusMinus >= 0 ? '+' : '') + String(player.plusMinus)).padStart(3)
							: ((player.plusMinus >= 0 ? '+' : '') + String(player.plusMinus)).padStart(4);

						const text = compact
							? `${'  '}${displayNum} ${displayName} ${displayPos} ${displayGP} ${displayGoals} ${displayAssists} ${displayPoints} ${displayPlusMinus}`
							: `${'  '}${displayNum} ${displayName} ${displayPos} ${displayGP} ${displayGoals} ${displayAssists} ${displayPoints} ${displayPlusMinus} ${String(player.shots).padStart(4)} ${(player.shootingPctg > 0 ? `${(player.shootingPctg * 100).toFixed(1)}%` : '0.0%').padStart(5)}`;
						const padding = Math.max(0, lineWidth - text.length);
						const fullText = `${text}${' '.repeat(padding)}`;

						return (
							<Box key={absoluteIndex}>
								<Text inverse={isSelected}>{fullText}</Text>
							</Box>
						);
					})}
				</>
			)}

			{showGoaliesHeader && (
				<>
					{showPlayersHeader && <Box marginTop={1} />}
					<Box>
						<Text bold>
							{compact
								? `${'  '}${'#'.padEnd(3)} ${'Name'.padEnd(15)} ${'GP'.padStart(3)} ${'W'.padStart(2)} ${'L'.padStart(2)} ${'GAA'.padStart(4)} ${'SV%'.padStart(4)} ${'SO'.padStart(2)}`
								: `${'  '}${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'GP'.padStart(4)} ${'W'.padStart(3)} ${'L'.padStart(3)} ${'OTL'.padStart(4)} ${'GAA'.padStart(5)} ${'SV%'.padStart(5)} ${'SO'.padStart(3)}`
							}
						</Text>
					</Box>
					{visibleGoalies.map((goalie, idx) => {
						const absoluteIndex = players.length + visibleGoaliesStart + idx;
						const isSelected = absoluteIndex === scrollIndex;

						const nameLen = compact ? 15 : 20;
						const displayNum = compact ? String(goalie.sweaterNumber ?? '').padEnd(3) : String(goalie.sweaterNumber ?? '').padEnd(4);
						const displayName = `${goalie.firstName.charAt(0)}. ${goalie.lastName}`
							.slice(0, nameLen)
							.padEnd(nameLen);
						const displayGP = compact ? String(goalie.gamesPlayed).padStart(3) : String(goalie.gamesPlayed).padStart(4);
						const displayWins = compact ? String(goalie.wins).padStart(2) : String(goalie.wins).padStart(3);
						const displayLosses = compact ? String(goalie.losses).padStart(2) : String(goalie.losses).padStart(3);
						const displayGAA = compact ? goalie.goalsAgainstAverage.toFixed(2).padStart(4) : goalie.goalsAgainstAverage.toFixed(2).padStart(5);
						const displaySavePct = compact
							? (goalie.savePct > 0 ? goalie.savePct.toFixed(3) : '.000').padStart(4)
							: (goalie.savePct > 0 ? goalie.savePct.toFixed(3) : '0.000').padStart(5);
						const displayShutouts = compact ? String(goalie.shutouts).padStart(2) : String(goalie.shutouts).padStart(3);

						const text = compact
							? `${'  '}${displayNum} ${displayName} ${displayGP} ${displayWins} ${displayLosses} ${displayGAA} ${displaySavePct} ${displayShutouts}`
							: `${'  '}${displayNum} ${displayName} ${displayGP} ${displayWins} ${displayLosses} ${String(goalie.otLosses).padStart(4)} ${displayGAA} ${displaySavePct} ${displayShutouts}`;
						const padding = Math.max(0, lineWidth - text.length);
						const fullText = `${text}${' '.repeat(padding)}`;

						return (
							<Box key={absoluteIndex}>
								<Text inverse={isSelected}>{fullText}</Text>
							</Box>
						);
					})}
				</>
			)}
		</Box>
	);
};

export default TeamPlayersTab;
