import { Box, Text } from 'ink';
import type React from 'react';
import { useTeamRosterData } from '@/ui/components/standings-detail/useTeamRosterData.js';

type TeamPlayersTabProps = {
	teamAbbrev: string;
	scrollIndex: number;
	height: number;
};

const TeamPlayersTab: React.FC<TeamPlayersTabProps> = ({ teamAbbrev, scrollIndex, height }) => {
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
							{`${'  '}${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'Pos'.padEnd(4)} ${'GP'.padStart(4)} ${'G'.padStart(3)} ${'A'.padStart(3)} ${'Pts'.padStart(4)} ${'+/-'.padStart(4)} ${'SOG'.padStart(4)} ${'SH%'.padStart(5)}`}
						</Text>
					</Box>
					{visiblePlayers.map((player, idx) => {
						const absoluteIndex = visiblePlayersStart + idx;
						const isSelected = absoluteIndex === scrollIndex;

						const displayNum = String(player.sweaterNumber).padEnd(4);
						const displayName = `${player.firstName.charAt(0)}. ${player.lastName}`
							.slice(0, 20)
							.padEnd(20);
						const displayPos = player.positionCode.padEnd(4);
						const displayGP = String(player.gamesPlayed).padStart(4);
						const displayGoals = String(player.goals).padStart(3);
						const displayAssists = String(player.assists).padStart(3);
						const displayPoints = String(player.points).padStart(4);
						const displayPlusMinus = (
							(player.plusMinus >= 0 ? '+' : '') + String(player.plusMinus)
						).padStart(4);
						const displayShots = String(player.shots).padStart(4);
						const displayShootingPct = (
							player.shootingPctg > 0 ? `${player.shootingPctg.toFixed(1)}%` : '0.0%'
						).padStart(5);

						return (
							<Box key={absoluteIndex}>
								<Text dimColor={!isSelected}>
									{`${isSelected ? '> ' : '  '}${displayNum} ${displayName} ${displayPos} ${displayGP} ${displayGoals} ${displayAssists} ${displayPoints} ${displayPlusMinus} ${displayShots} ${displayShootingPct}`}
								</Text>
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
							{`${'  '}${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'GP'.padStart(4)} ${'W'.padStart(3)} ${'L'.padStart(3)} ${'OTL'.padStart(4)} ${'GAA'.padStart(5)} ${'SV%'.padStart(5)} ${'SO'.padStart(3)}`}
						</Text>
					</Box>
					{visibleGoalies.map((goalie, idx) => {
						const absoluteIndex = players.length + visibleGoaliesStart + idx;
						const isSelected = absoluteIndex === scrollIndex;

						const displayNum = String(goalie.sweaterNumber).padEnd(4);
						const displayName = `${goalie.firstName.charAt(0)}. ${goalie.lastName}`
							.slice(0, 20)
							.padEnd(20);
						const displayGP = String(goalie.gamesPlayed).padStart(4);
						const displayWins = String(goalie.wins).padStart(3);
						const displayLosses = String(goalie.losses).padStart(3);
						const displayOTL = String(goalie.otLosses).padStart(4);
						const displayGAA = goalie.goalsAgainstAverage.toFixed(2).padStart(5);
						const displaySavePct = (
							goalie.savePct > 0 ? goalie.savePct.toFixed(3) : '0.000'
						).padStart(5);
						const displayShutouts = String(goalie.shutouts).padStart(3);

						return (
							<Box key={absoluteIndex}>
								<Text dimColor={!isSelected}>
									{`${isSelected ? '> ' : '  '}${displayNum} ${displayName} ${displayGP} ${displayWins} ${displayLosses} ${displayOTL} ${displayGAA} ${displaySavePct} ${displayShutouts}`}
								</Text>
							</Box>
						);
					})}
				</>
			)}
		</Box>
	);
};

export default TeamPlayersTab;
