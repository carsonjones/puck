const TEAM_NAMES: Record<string, string> = {
	NJD: 'New Jersey Devils',
	NYI: 'New York Islanders',
	NYR: 'New York Rangers',
	PHI: 'Philadelphia Flyers',
	PIT: 'Pittsburgh Penguins',
	BOS: 'Boston Bruins',
	BUF: 'Buffalo Sabres',
	MTL: 'Montreal Canadiens',
	OTT: 'Ottawa Senators',
	TOR: 'Toronto Maple Leafs',
	CAR: 'Carolina Hurricanes',
	FLA: 'Florida Panthers',
	TBL: 'Tampa Bay Lightning',
	WSH: 'Washington Capitals',
	CHI: 'Chicago Blackhawks',
	DET: 'Detroit Red Wings',
	NSH: 'Nashville Predators',
	STL: 'St. Louis Blues',
	CGY: 'Calgary Flames',
	COL: 'Colorado Avalanche',
	EDM: 'Edmonton Oilers',
	VAN: 'Vancouver Canucks',
	ANA: 'Anaheim Ducks',
	DAL: 'Dallas Stars',
	LAK: 'Los Angeles Kings',
	SJS: 'San Jose Sharks',
	CBJ: 'Columbus Blue Jackets',
	MIN: 'Minnesota Wild',
	WPG: 'Winnipeg Jets',
	ARI: 'Arizona Coyotes',
	VGK: 'Vegas Golden Knights',
	SEA: 'Seattle Kraken',
	UTA: 'Utah Hockey Club',
};

const POSITION_NAMES: Record<string, string> = {
	C: 'Center',
	L: 'Left Wing',
	R: 'Right Wing',
	D: 'Defense',
	G: 'Goalie',
};

export const getFullTeamName = (abbrev: string): string => {
	return TEAM_NAMES[abbrev] || abbrev;
};

export const getFullPositionName = (position: string): string => {
	return POSITION_NAMES[position] || position;
};
