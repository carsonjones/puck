import React from "react";
import { Box, Text } from "ink";
import GamesScreen from "./ui/screens/GamesScreen.js";
import { getToken } from "./auth/token.js";

const App: React.FC = () => {
  const token = getToken();

  if (!token) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">Missing token</Text>
        <Text>Set NHL_TOKEN in your environment.</Text>
        <Text dimColor>Example: NHL_TOKEN=... bun dev</Text>
      </Box>
    );
  }

  return <GamesScreen />;
};

export default App;
