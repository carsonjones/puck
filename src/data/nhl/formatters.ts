export const formatSeasonId = (seasonId: number): string => {
  const start = Math.floor(seasonId / 10000);
  return `${start}-${start + 1}`;
};

export const getCurrentSeasonId = (): number => {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() < 9) {
    year -= 1;
  }
  return year * 10000 + (year + 1);
};
