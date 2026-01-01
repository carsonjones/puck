export const clampIndex = (current: number, delta: number, maxIndex?: number): number => {
	const nextIndex = current + delta;
	return typeof maxIndex === 'number'
		? Math.max(0, Math.min(maxIndex, nextIndex))
		: Math.max(0, nextIndex);
};
