export const focusedPanes = ['list', 'detail'] as const;
export type FocusedPane = (typeof focusedPanes)[number];

export const detailTabs = ['stats', 'plays', 'players'] as const;
export type DetailTab = (typeof detailTabs)[number];

export const playsSortOrders = ['asc', 'desc'] as const;
export type PlaysSortOrder = (typeof playsSortOrders)[number];

export const gameStatuses = ['scheduled', 'in_progress', 'final'] as const;
export type GameStatus = (typeof gameStatuses)[number];

export const viewModes = ['games', 'standings', 'players'] as const;
export type ViewMode = (typeof viewModes)[number];

export const playerDetailTabs = ['season', 'games', 'bio'] as const;
export type PlayerDetailTab = (typeof playerDetailTabs)[number];

export const standingsTabs = ['league', 'conference', 'division'] as const;
export type StandingsTab = (typeof standingsTabs)[number];

export const standingsDetailTabs = ['info', 'players'] as const;
export type StandingsDetailTab = (typeof standingsDetailTabs)[number];

export const standingsConferences = ['eastern', 'western'] as const;
export type StandingsConference = (typeof standingsConferences)[number];

export const standingsDivisions = ['atlantic', 'metropolitan', 'central', 'pacific'] as const;
export const standingsDivisionDisplayNames: Record<StandingsDivision, string> = {
  atlantic: 'atlantic',
  metropolitan: 'metro',
  central: 'central',
  pacific: 'pacific',
};
export type StandingsDivision = (typeof standingsDivisions)[number];

export const standingsViewModes = ['all', 'home', 'road'] as const;
export type StandingsViewMode = (typeof standingsViewModes)[number];

export interface PreviousStandingsState {
  teamAbbrev: string | null;
  playerIndex: number;
}

export interface AppNavigationState {
  focusedPane: FocusedPane;
  selectedGameId: string | null;
  listCursorIndex: number;
  pageCursor: string | null;
  detailTab: DetailTab;
  playsScrollIndex: number;
  playsSortOrder: PlaysSortOrder;
  playersTeamTab: 'away' | 'home';
  playersScrollIndex: number;
  viewMode: ViewMode;
  standingsTab: StandingsTab;
  standingsCursorIndex: number;
  standingsDetailTab: StandingsDetailTab;
  standingsPlayersScrollIndex: number;
  standingsConference: StandingsConference;
  standingsDivision: StandingsDivision;
  standingsViewMode: StandingsViewMode;
  playersCursorIndex: number;
  selectedPlayerId: number | null;
  playerDetailTab: PlayerDetailTab;
  playerDetailScrollIndex: number;
  previousStandingsState: PreviousStandingsState | null;
  teamSearchOpen: boolean;
  teamSearchQuery: string;
  teamSearchCursorIndex: number;
  gameTeamFilter: string | null;
  playerFilter: number | null;
  pendingTeamNavigation: string | null;
}

export const initialAppNavigationState: AppNavigationState = {
  focusedPane: 'list',
  selectedGameId: null,
  listCursorIndex: 0,
  pageCursor: null,
  detailTab: 'stats',
  playsScrollIndex: 0,
  playsSortOrder: 'asc',
  playersTeamTab: 'away',
  playersScrollIndex: 0,
  viewMode: 'games',
  standingsTab: 'league',
  standingsCursorIndex: 0,
  standingsDetailTab: 'players',
  standingsPlayersScrollIndex: 0,
  standingsConference: 'eastern',
  standingsDivision: 'atlantic',
  standingsViewMode: 'all',
  playersCursorIndex: 0,
  selectedPlayerId: null,
  playerDetailTab: 'season',
  playerDetailScrollIndex: 0,
  previousStandingsState: null,
  teamSearchOpen: false,
  teamSearchQuery: '',
  teamSearchCursorIndex: 0,
  gameTeamFilter: null,
  playerFilter: null,
  pendingTeamNavigation: null,
};
