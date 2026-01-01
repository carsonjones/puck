export const useWindowedList = <T>(
	items: T[],
	scrollIndex: number,
	height: number,
	headerLines: number = 0,
) => {
	const windowSize = Math.max(1, height - headerLines);
	const half = Math.floor(windowSize / 2);
	const start = Math.max(0, Math.min(items.length - windowSize, scrollIndex - half));
	const end = Math.min(items.length, start + windowSize);
	const visible = items.slice(start, end);

	return { visible, start, end, windowSize };
};
