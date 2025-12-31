import type React from 'react';
import type { StandingListItem } from '@/data/api/client.js';
import StandingsDetailTabs from '@/ui/components/standings-detail/StandingsDetailTabs.js';

type StandingsDetailProps = {
	team: StandingListItem | null;
	height: number;
};

const StandingsDetail: React.FC<StandingsDetailProps> = ({ team, height }) => {
	return <StandingsDetailTabs team={team} height={height} />;
};

export default StandingsDetail;
