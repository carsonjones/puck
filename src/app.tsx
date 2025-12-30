import React from "react";
import { useAppStore } from "./state/useAppStore.js";
import GamesScreen from "./ui/screens/GamesScreen.js";
import StandingsScreen from "./ui/screens/StandingsScreen.js";

const App: React.FC = () => {
  const viewMode = useAppStore((state) => state.viewMode);

  return viewMode === "standings" ? <StandingsScreen /> : <GamesScreen />;
};

export default App;
