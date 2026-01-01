import { useStdout } from 'ink';

export const useLineWidth = (): number => {
	const { stdout } = useStdout();
	const width = stdout?.columns ?? 80;
	return Math.max(1, Math.floor(width / 2) - 10);
};
