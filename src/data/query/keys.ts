export const queryKeys = {
  gamesList: (cursor: string | null, limit: number) =>
    `games:list:${cursor ?? "start"}:${limit}`,
  gameDetail: (id: string) => `games:detail:${id}`,
  standings: () => "standings:current",
  teamRoster: (abbrev: string) => `team:roster:${abbrev}`,
  playerStats: (playerId: number) => `player:stats:${playerId}`,
  playersLeaderboard: () => "players:leaderboard",
  playerDetail: (playerId: number) => `player:detail:${playerId}`,
  playerGameLog: (playerId: number) => `player:game-log:${playerId}`,
};
