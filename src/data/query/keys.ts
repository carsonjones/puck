export const queryKeys = {
  gamesList: (cursor: string | null, limit: number) =>
    `games:list:${cursor ?? "start"}:${limit}`,
  gameDetail: (id: string) => `games:detail:${id}`,
  standings: () => "standings:current",
};
