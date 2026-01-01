import { Box, Text } from 'ink';
import type React from 'react';
import type { StandingListItem } from '@/data/api/client.js';
import { useLineWidth } from '@/hooks/useLineWidth.js';
import { useAppStore } from '@/state/useAppStore.js';
import TeamInfoTab from '@/ui/components/standings-detail/TeamInfoTab.js';
import TeamPlayersTab from '@/ui/components/standings-detail/TeamPlayersTab.js';
import Tabs from '@/ui/components/Tabs.js';

type StandingsDetailTabsProps = {
	team: StandingListItem | null;
	height: number;
};

const StandingsDetailTabs: React.FC<StandingsDetailTabsProps> = ({ team, height }) => {
	const { standingsPlayersScrollIndex, standingsDetailTab, standingsViewMode } = useAppStore();
	const lineWidth = useLineWidth();

	if (!team) {
		return <Text dimColor>Select a team to view details.</Text>;
	}

	const getRecord = () => {
		if (standingsViewMode === 'home') {
			return `${team.homeWins}-${team.homeLosses}-${team.homeOtLosses}`;
		}
		if (standingsViewMode === 'road') {
			return `${team.roadWins}-${team.roadLosses}-${team.roadOtLosses}`;
		}
		return `${team.wins}-${team.losses}-${team.otLosses}`;
	};

	const getPoints = () => {
		if (standingsViewMode === 'home') return team.homePoints;
		if (standingsViewMode === 'road') return team.roadPoints;
		return team.points;
	};

	const viewLabel =
		standingsViewMode === 'home' ? ' (Home)' : standingsViewMode === 'road' ? ' (Road)' : '';

	return (
		<Box flexDirection="column">
			<Box flexDirection="column" marginBottom={1}>
				<Box minHeight={1}>
					<Text bold>{`${team.teamName}${viewLabel}`}</Text>
				</Box>
				<Box minHeight={1}>
					<Text dimColor>{`${team.conferenceName} - ${team.divisionName}`}</Text>
				</Box>
				<Box minHeight={1}>
					<Text>{`${getRecord()} (${getPoints()} pts)`}</Text>
				</Box>
			</Box>
			<Text dimColor>{'─'.repeat(lineWidth)}</Text>
			<Box flexDirection="column">
				<Tabs tabs={['players', 'info']} active={standingsDetailTab} />
				<Text dimColor>{'─'.repeat(lineWidth)}</Text>
				<Box>
					{standingsDetailTab === 'players' ? (
						<TeamPlayersTab
							teamAbbrev={team.teamAbbrev}
							scrollIndex={standingsPlayersScrollIndex}
							height={height}
						/>
					) : (
						<TeamInfoTab team={team} />
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default StandingsDetailTabs;
