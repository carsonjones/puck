import { Box } from 'ink';
import type React from 'react';

const SplitPane: React.FC<{
	left: React.ReactNode;
	right: React.ReactNode;
	leftWidth?: number;
}> = ({ left, right, leftWidth = 45 }) => {
	return (
		<Box flexDirection="row" width="100%">
			<Box width={`${leftWidth}%`} flexDirection="column" borderStyle="round">
				{left}
			</Box>
			<Box flexGrow={1} marginLeft={1} flexDirection="column" borderStyle="round">
				{right}
			</Box>
		</Box>
	);
};

export default SplitPane;
