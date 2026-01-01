export const formatDate = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, days: number) => {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
};

export const formatLocalTime = (isoTimestamp: string) => {
	const parsed = new Date(isoTimestamp);
	if (Number.isNaN(parsed.getTime())) return isoTimestamp.slice(11, 16);
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	}).format(parsed);
};
