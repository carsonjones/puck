export type Schedule = {
	nextStartDate: string;
	previousStartDate: string;
	gameWeek: GameDay[];
	games: Game[];
	events: unknown[];
};

export type GameDay = {
	date: string;
	games: Game[];
};

export type Game = {
	id: number;
	season: number;
	gameType: number;
	gameDate: string;
	gameCenterLink: string;
	venue: Venue;
	startTimeUTC: string;
	easternUTCOffset: string;
	venueUTCOffset: string;
	tvBroadcasts: TVBroadcast[];
	gameState: string;
	gameScheduleState: string;
	awayTeam: Team;
	homeTeam: Team;
	period: number;
	periodDescriptor: PeriodDescriptor;
	clock: GameClock;
	situation?: GameSituation;
};

export type Venue = {
	default: string;
};

export type VenueLocation = {
	default: string;
};

export type Team = {
	id: number;
	name: LanguageNames;
	commonName: LanguageNames;
	placeNameWithPreposition: LanguageNames;
	abbrev: string;
	score: number;
	sog: number;
	logo: string;
};

export type LanguageNames = {
	default: string;
	fr?: string;
};

export type GameOutcome = {
	lastPeriodType: string;
};

export type PlayerInfo = {
	id: number;
	firstName: NameInfo;
	lastName: NameInfo;
	positionCode: string;
	sweaterNumber: number;
	heightInInches: number;
	weightInPounds: number;
	birthDate: string;
	birthCity: NameInfo;
	birthCountry: string;
	birthStateProvince?: NameInfo;
	shootsCatches: string;
	headshot: string;
};

export type NameInfo = {
	default: string;
};

export type TeamRoster = {
	forwards: PlayerInfo[];
	defensemen: PlayerInfo[];
	goalies: PlayerInfo[];
};

export type Record = {
	wins: number;
	losses: number;
	otLosses: number;
	points: number;
};

export type TeamStats = {
	goals: number;
	sog: number;
	faceoffPct: number;
	hits: number;
	pim: number;
	powerPlay: PowerPlayStats;
};

export type ScoreboardResponse = {
	focusedDate: string;
	focusedDateCount: number;
	gamesByDate: GamesByDate[];
};

export type GamesByDate = {
	date: string;
	games: Game[];
};

export type TVBroadcast = {
	id: number;
	market: string;
	countryCode: string;
	network: string;
	sequenceNumber: number;
};

export type PeriodDescriptor = {
	number: number;
	periodType: string;
	maxRegulationPeriods: number;
};

export type FilteredScoreboardResponse = {
	date: string;
	games: Game[];
};

export type TeamsResponse = {
	teams: TeamInfo[];
};

export type TeamInfo = {
	id: number;
	name: LanguageNames;
	abbreviation: string;
	city: LanguageNames;
	triCode: string;
	franchiseId: number;
	active: boolean;
};

export type RosterResponse = {
	forwards: PlayerInfo[];
	defensemen: PlayerInfo[];
	goalies: PlayerInfo[];
};

export type PlayerSearchResult = {
	firstName: NameInfo;
	lastName: NameInfo;
	position: string;
	jerseyNumber: number;
	teamId: number;
	teamAbbrev: string;
	playerId: number;
};

export type SkaterStats = {
	assists: number;
	evGoals: number;
	evPoints: number;
	faceoffWinPct: number;
	gameWinningGoals: number;
	gamesPlayed: number;
	goals: number;
	lastName: string;
	otGoals: number;
	penaltyMinutes: number;
	playerId: number;
	plusMinus: number;
	points: number;
	pointsPerGame: number;
	positionCode: string;
	ppGoals: number;
	ppPoints: number;
	seasonId: number;
	shGoals: number;
	shPoints: number;
	shootingPct: number;
	shootsCatches: string;
	shots: number;
	skaterFullName: string;
	teamAbbrevs: string;
	timeOnIcePerGame: number;
};

export type GoalieStats = {
	assists: number;
	gamesPlayed: number;
	gamesStarted: number;
	goalieFullName: string;
	goals: number;
	goalsAgainst: number;
	goalsAgainstAverage: number;
	lastName: string;
	losses: number;
	otLosses: number;
	penaltyMinutes: number;
	playerId: number;
	points: number;
	savePct: number;
	saves: number;
	seasonId: number;
	shootsCatches: string;
	shotsAgainst: number;
	shutouts: number;
	teamAbbrevs: string;
	timeOnIce: number;
	wins: number;
};

export type StatsResponse = {
	data: unknown[];
	total: number;
};

export type SkaterStatsResponse = {
	data: SkaterStats[];
	total: number;
};

export type GoalieStatsResponse = {
	data: GoalieStats[];
	total: number;
};

export type StatsFilter = {
	gameType?: number;
	seasonId?: number;
};

export type PlayerLandingResponse = {
	seasonTotals: SeasonTotal[];
};

export type SeasonTotal = {
	assists?: number;
	avgToi?: string;
	faceoffWinningPctg?: number;
	gameTypeId: number;
	gameWinningGoals?: number;
	gamesPlayed: number;
	goals?: number;
	leagueAbbrev: string;
	otGoals?: number;
	pim?: number;
	plusMinus?: number;
	points: number;
	powerPlayGoals?: number;
	powerPlayPoints?: number;
	season: number;
	shootingPctg?: number;
	shorthandedGoals?: number;
	shorthandedPoints?: number;
	shots?: number;
	teamName: {
		default: string;
	};
	// Goalie stats
	wins?: number;
	losses?: number;
	otLosses?: number;
	goalsAgainstAverage?: number;
	savePctg?: number;
	shutouts?: number;
};

export type TeamScheduleResponse = {
	games: ScheduleGame[];
};

export type ScheduleGame = {
	id: number;
	season: number;
	gameType: number;
	gameDate: string;
	venue?: Venue;
	startTimeUTC: string;
	venueUTCOffset: string;
	gameState: string;
	homeTeam: TeamInSchedule;
	awayTeam: TeamInSchedule;
	gameCenterLink: string;
};

export type TeamInSchedule = {
	id: number;
	name: LanguageNames;
	abbrev: string;
	score: number;
};

export type PlayerStatsResponse = {
	splits: SeasonTotal[];
};

export type StandingsResponse = {
	standings: StandingsTeam[];
};

export type StandingsTeam = {
	teamName: LanguageNames;
	teamAbbrev: TeamAbbrev;
	conferenceName: string;
	divisionName: string;
	wins: number;
	losses: number;
	otLosses: number;
	regulationWins: number;
	points: number;
	gamesPlayed: number;
	goalFor: number;
	goalAgainst: number;
	goalDifferential: number;
	streakCode: string;
	streakCount: number;
	homeGamesPlayed: number;
	homeWins: number;
	homeLosses: number;
	homeOtLosses: number;
	homePoints: number;
	l10GamesPlayed: number;
	l10Wins: number;
	l10Losses: number;
	l10OtLosses: number;
	l10Points: number;
	leagueSequence: number;
	conferenceSequence: number;
	divisionSequence: number;
	wildcardSequence: number;
	pointsPercentage: number;
};

export type TeamAbbrev = {
	default: string;
	french?: string;
};

export type GameDetails = {
	id: number;
	gameType: number;
	season: number;
	gameDate: string;
	startTimeUTC: string;
	venue: Venue;
	gameState: string;
	homeTeam: DetailedTeam;
	awayTeam: DetailedTeam;
	clock: GameClock;
	tvBroadcasts: TVBroadcast[];
	summary: GameSummary;
	threeStars: StarPlayer[];
};

export type DetailedTeam = {
	id: number;
	commonName: LanguageNames;
	abbrev: string;
	placeName: LanguageNames;
	placeNameWithPreposition: LanguageNames;
	score: number;
	sog: number;
	logo: string;
	darkLogo: string;
};

export type GameSummary = {
	scoring: PeriodSummary[];
	shootout: unknown[];
	penalties: PeriodPenalties[];
};

export type PeriodSummary = {
	periodDescriptor: PeriodDescriptor;
	goals: GoalEvent[];
};

export type PeriodPenalties = {
	periodDescriptor: PeriodDescriptor;
	penalties: PenaltyEvent[];
};

export type GoalEvent = {
	situationCode: string;
	strength: string;
	playerId: number;
	firstName: LanguageNames;
	lastName: LanguageNames;
	name: LanguageNames;
	teamAbbrev: LanguageNames;
	timeInPeriod: string;
	shotType: string;
	goalModifier: string;
	awayScore: number;
	homeScore: number;
	leadingTeamAbbrev?: LanguageNames;
	assists: AssistEvent[];
};

export type AssistEvent = {
	playerId: number;
	firstName: LanguageNames;
	lastName: LanguageNames;
	name: LanguageNames;
	assistsToDate: number;
	sweaterNumber: number;
};

export type PenaltyEvent = {
	timeInPeriod: string;
	type: string;
	duration: number;
	committedByPlayer: string;
	teamAbbrev: LanguageNames;
	drawnBy: string;
	descKey: string;
};

export type StarPlayer = {
	star: number;
	playerId: number;
	teamAbbrev: string;
	headshot: string;
	name: LanguageNames;
	sweaterNo: number;
	position: string;
	goals?: number;
	assists?: number;
	points?: number;
	savePctg?: number;
};

export type TeamGameStats = {
	id: number;
	name: LanguageNames;
	abbrev: string;
	score: number;
	sog: number;
	faceoffPct: number;
	powerPlay: PowerPlayStats;
	scratches: PlayerBrief[];
	leaders: GameTeamLeaders;
};

export type PowerPlayStats = {
	goals: number;
	opportunities: number;
	percentage: number;
};

export type GameTeamLeaders = {
	goals: PlayerBrief[];
	assists: PlayerBrief[];
	points: PlayerBrief[];
};

export type PlayerBrief = {
	id: number;
	name: LanguageNames;
	position: string;
	sweaterNumber: string;
};

export type GameClock = {
	timeRemaining: string;
	secondsRemaining: number;
	running: boolean;
	inIntermission: boolean;
};

export type BoxscoreResponse = {
	id: number;
	season: number;
	gameType: number;
	gameDate: string;
	startTimeUTC: string;
	venue: Venue;
	gameState: string;
	homeTeam: DetailedTeam;
	awayTeam: DetailedTeam;
	playerByGameStats: PlayerGameStats;
};

export type PlayerGameStats = {
	homeTeam: TeamPlayerStats;
	awayTeam: TeamPlayerStats;
};

export type TeamPlayerStats = {
	forwards: PlayerStats[];
	defense: PlayerStats[];
	goalies: GoalieGameStats[];
};

export type PlayerStats = {
	playerId: number;
	sweaterNumber: number;
	name: LanguageNames;
	position: string;
	goals: number;
	assists: number;
	points: number;
	plusMinus: number;
	pim: number;
	hits: number;
	powerPlayGoals: number;
	sog: number;
	faceoffWinningPctg: number;
	toi: string;
	blockedShots: number;
	shifts: number;
	giveaways: number;
	takeaways: number;
};

export type GoalieGameStats = {
	playerId: number;
	sweaterNumber: number;
	name: LanguageNames;
	position: string;
	evenStrengthShotsAgainst: string;
	powerPlayShotsAgainst: string;
	shorthandedShotsAgainst: string;
	saveShotsAgainst: string;
	savePctg: number;
	evenStrengthGoalsAgainst: number;
	powerPlayGoalsAgainst: number;
	shorthandedGoalsAgainst: number;
	pim: number;
	goalsAgainst: number;
	toi: string;
	starter: boolean;
	decision?: string;
	shotsAgainst: number;
	saves: number;
};

export type PeriodStats = {
	periodNumber: number;
	homeScore: number;
	awayScore: number;
	goals: GoalSummary[];
	penalties: PenaltySummary[];
};

export type GoalSummary = {
	period: number;
	timeInPeriod: string;
	goalType: string;
	scoredBy: PlayerBrief;
	assistedBy: PlayerBrief[];
};

export type PenaltySummary = {
	period: number;
	timeInPeriod: string;
	type: string;
	minutes: number;
	player: PlayerBrief;
};

export type PenaltyBoxItem = {
	player: PlayerBrief;
	timeRemaining: string;
	type: string;
};

export type Official = {
	name: string;
	role: string;
};

export type Coach = {
	name: string;
	position: string;
};

export type PlayByPlayResponse = {
	plays: PlayEvent[];
	rosterSpots: RosterSpot[];
};

export type RosterSpot = {
	teamId: number;
	playerId: number;
	firstName: LanguageNames;
	lastName: LanguageNames;
	sweaterNumber: number;
	positionCode: string;
	headshot: string;
};

export type PlayEvent = {
	eventId: number;
	periodDescriptor: PeriodDescriptor;
	timeInPeriod: string;
	timeRemaining: string;
	situationCode: string;
	typeCode: number;
	typeDescKey: string;
	details: EventDetails;
};

export type EventDetails = {
	eventOwnerTeamId?: number;
	xCoord?: number;
	yCoord?: number;
	zoneCode?: string;
	shotType?: string;
	shootingPlayerId?: number;
	goalieInNetId?: number;
	blockingPlayerId?: number;
	hittingPlayerId?: number;
	hitteePlayerId?: number;
	winningPlayerId?: number;
	losingPlayerId?: number;
	reason?: string;
	typeCode?: string;
	descKey?: string;
	duration?: number;
	committedByPlayerId?: number;
	drawnByPlayerId?: number;
	awaySOG?: number;
	homeSOG?: number;
	scoringPlayerId?: number;
	scoringPlayerTotal?: number;
	assist1PlayerId?: number;
	assist1PlayerTotal?: number;
	assist2PlayerId?: number;
	assist2PlayerTotal?: number;
};

export type GameStoryResponse = {
	id: number;
	season: number;
	gameType: number;
	gameDate: string;
	venue: Venue;
	venueLocation: VenueLocation;
	startTimeUTC: string;
	easternUTCOffset: string;
	venueUTCOffset: string;
	venueTimezone: string;
	tvBroadcasts: TVBroadcast[];
	gameState: string;
	gameScheduleState: string;
	homeTeam: Team;
	awayTeam: Team;
	shootoutInUse: boolean;
	maxPeriods: number;
	regPeriods: number;
	otInUse: boolean;
	tiesInUse: boolean;
	summary: GameSummary;
	periodDescriptor: PeriodDescriptor;
	clock: GameClock;
};

export type GameSituation = {
	homeTeam: {
		abbrev: string;
		situationDescriptions: string[];
		strength: number;
	};
	awayTeam: {
		abbrev: string;
		strength: number;
	};
	situationCode: string;
	timeRemaining: string;
	secondsRemaining: number;
};

export type StatsLeaderPlayer = {
	id: number;
	firstName: LanguageNames;
	lastName: LanguageNames;
	sweaterNumber: number;
	headshot: string;
	teamAbbrev: string;
	teamName: LanguageNames;
	teamLogo: string;
	position: string;
	value: number;
};

export type StatsLeadersResponse = {
	goalsSh: StatsLeaderPlayer[];
	plusMinus: StatsLeaderPlayer[];
	assists: StatsLeaderPlayer[];
	goalsPp: StatsLeaderPlayer[];
	faceoffLeaders: StatsLeaderPlayer[];
	penaltyMins: StatsLeaderPlayer[];
	goals: StatsLeaderPlayer[];
	points: StatsLeaderPlayer[];
	toi: StatsLeaderPlayer[];
};
