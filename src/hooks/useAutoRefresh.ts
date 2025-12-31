import { useEffect, useRef } from 'react';

type AutoRefreshOptions = {
	enabled?: boolean;
	intervalMs: number;
	onRefresh: () => void;
};

export const useAutoRefresh = ({ enabled = true, intervalMs, onRefresh }: AutoRefreshOptions) => {
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const onRefreshRef = useRef(onRefresh);

	onRefreshRef.current = onRefresh;

	const resetTimer = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}

		if (enabled) {
			timerRef.current = setInterval(() => {
				onRefreshRef.current();
			}, intervalMs);
		}
	};

	useEffect(() => {
		if (!enabled) {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			return;
		}

		resetTimer();

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [enabled, resetTimer]);

	return { resetTimer };
};
