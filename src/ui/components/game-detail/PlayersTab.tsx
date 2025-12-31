import { Box, Text } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import type { GameDetail } from "@/data/api/client.js";
import { NhlClient } from "@/data/nhl/client.js";
import type { RosterResponse } from "@/data/nhl/models.js";

type PlayersTabProps = {
  game: GameDetail;
  scrollIndex: number;
  height: number;
};

type PlayerRow = {
  type: "player" | "header";
  number?: number;
  name: string;
  position?: string;
  goals?: number;
  assists?: number;
  shots?: number;
  hits?: number;
  saves?: number;
  savePct?: number;
  isGoalie?: boolean;
};

const PlayersTab: React.FC<PlayersTabProps> = ({ game, scrollIndex, height }) => {
  const [rosters, setRosters] = useState<{ away?: RosterResponse; home?: RosterResponse } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (game.status !== "scheduled") return;

    const fetchRosters = async () => {
      setLoading(true);
      const nhlClient = new NhlClient();
      try {
        const [away, home] = await Promise.all([
          nhlClient.getTeamRoster(game.awayTeamAbbrev),
          nhlClient.getTeamRoster(game.homeTeamAbbrev),
        ]);
        setRosters({ away, home });
      } catch {
        setRosters({ away: undefined, home: undefined });
      }
      setLoading(false);
    };

    fetchRosters();
  }, [game.id, game.status, game.awayTeamAbbrev, game.homeTeamAbbrev]);

  if (game.status === "scheduled") {
    if (loading) {
      return <Text dimColor>Loading rosters...</Text>;
    }

    if (!rosters?.away || !rosters?.home) {
      return <Text color="red">Failed to load rosters.</Text>;
    }

    const awayPlayers = [
      ...rosters.away.forwards.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
      ...rosters.away.defensemen.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
      ...rosters.away.goalies.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
    ];

    const homePlayers = [
      ...rosters.home.forwards.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
      ...rosters.home.defensemen.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
      ...rosters.home.goalies.map((p) => ({ number: p.sweaterNumber, name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode })),
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>{game.awayTeam}</Text>
          {awayPlayers.map((p, idx) => (
            <Text key={idx}>{`  #${p.number} ${p.name} (${p.position})`}</Text>
          ))}
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text bold>{game.homeTeam}</Text>
          {homePlayers.map((p, idx) => (
            <Text key={idx}>{`  #${p.number} ${p.name} (${p.position})`}</Text>
          ))}
        </Box>
      </Box>
    );
  }

  // In-progress or final games - show stats
  if (!game.boxscore) {
    return <Text dimColor>No player stats available.</Text>;
  }

  const awayPlayers: PlayerRow[] = [
    ...(game.boxscore.playerByGameStats.awayTeam.forwards.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      goals: p.goals,
      assists: p.assists,
      shots: p.sog,
      hits: p.hits,
      isGoalie: false,
    })) || []),
    ...(game.boxscore.playerByGameStats.awayTeam.defense.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      goals: p.goals,
      assists: p.assists,
      shots: p.sog,
      hits: p.hits,
      isGoalie: false,
    })) || []),
    ...(game.boxscore.playerByGameStats.awayTeam.goalies.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      saves: p.saves,
      savePct: p.savePctg,
      isGoalie: true,
    })) || []),
  ];

  const homePlayers: PlayerRow[] = [
    ...(game.boxscore.playerByGameStats.homeTeam.forwards.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      goals: p.goals,
      assists: p.assists,
      shots: p.sog,
      hits: p.hits,
      isGoalie: false,
    })) || []),
    ...(game.boxscore.playerByGameStats.homeTeam.defense.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      goals: p.goals,
      assists: p.assists,
      shots: p.sog,
      hits: p.hits,
      isGoalie: false,
    })) || []),
    ...(game.boxscore.playerByGameStats.homeTeam.goalies.map((p) => ({
      type: "player" as const,
      number: p.sweaterNumber,
      name: p.name.default,
      position: p.position,
      saves: p.saves,
      savePct: p.savePctg,
      isGoalie: true,
    })) || []),
  ];

  const allPlayers = [
    { type: "header" as const, name: game.awayTeam },
    ...awayPlayers,
    { type: "header" as const, name: "" },
    { type: "header" as const, name: game.homeTeam },
    ...homePlayers,
  ];

  // Scrolling window logic
  const playersHeight = Math.max(5, height - 15);
  const windowSize = Math.max(1, playersHeight);
  const half = Math.floor(windowSize / 2);
  const start = Math.max(0, Math.min(allPlayers.length - windowSize, scrollIndex - half));
  const end = Math.min(allPlayers.length, start + windowSize);
  const visiblePlayers = allPlayers.slice(start, end);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>
          {`${"  "}${"#".padEnd(4)} ${"Name".padEnd(20)} ${"Pos".padEnd(4)} ${"G".padEnd(3)} ${"A".padEnd(3)} ${"SOG".padEnd(4)} ${"HTS".padEnd(4)} ${"SV".padEnd(4)} ${"SV%"}`}
        </Text>
      </Box>
      {visiblePlayers.map((player, idx) => {
        const absoluteIndex = start + idx;
        const isSelected = absoluteIndex === scrollIndex;

        if (player.type === "header") {
          return (
            <Box key={absoluteIndex}>
              <Text bold dimColor={player.name === ""}>
                {player.name === "" ? "" : player.name}
              </Text>
            </Box>
          );
        }

        const displayNum = String(player.number).padEnd(4);
        const displayName = player.name.slice(0, 20).padEnd(20);
        const displayPos = (player.position || "").padEnd(4);

        if (player.isGoalie) {
          const displaySaves = String(player.saves ?? 0).padEnd(4);
          const displaySavePct = player.savePct ? (player.savePct * 100).toFixed(1) + "%" : "n/a";
          return (
            <Box key={absoluteIndex}>
              <Text color={isSelected ? "cyan" : undefined}>
                {`${isSelected ? "> " : "  "}${displayNum} ${displayName} ${displayPos} ${"-".padEnd(3)} ${"-".padEnd(3)} ${"-".padEnd(4)} ${"-".padEnd(4)} ${displaySaves} ${displaySavePct}`}
              </Text>
            </Box>
          );
        }

        const displayGoals = String(player.goals ?? 0).padEnd(3);
        const displayAssists = String(player.assists ?? 0).padEnd(3);
        const displayShots = String(player.shots ?? 0).padEnd(4);
        const displayHits = String(player.hits ?? 0).padEnd(4);

        return (
          <Box key={absoluteIndex}>
            <Text color={isSelected ? "cyan" : undefined}>
              {`${isSelected ? "> " : "  "}${displayNum} ${displayName} ${displayPos} ${displayGoals} ${displayAssists} ${displayShots} ${displayHits} ${"-".padEnd(4)} ${"-"}`}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default PlayersTab;
