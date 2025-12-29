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

export const formatPeriod = (period: number, gameType: number): string => {
  if (period <= 0) return "n/a";
  if (period <= 3) {
    const suffix = period === 1 ? "st" : period === 2 ? "nd" : "rd";
    return `${period}${suffix}`;
  }

  const isPlayoffs = gameType === 3;

  if (period === 4) return "OT";
  if (period === 5 && !isPlayoffs) return "SO";

  const overtimeNumber = period - 3;
  const suffix = overtimeNumber === 2 ? "nd" : overtimeNumber === 3 ? "rd" : "th";
  return `${overtimeNumber}${suffix} OT`;
};
