"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import {
  Player,
  samplePlayers,
  POSITIONS,
  type PlayerPosition,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SavedGames } from "./saved-games";
import { SettingsView } from "./settings-view";
import { ChevronDown, Plus, Settings2, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerFormData {
  name: string;
  jerseyNumber: string;
  position: PlayerPosition;
}

export function GameSetup() {
  const {
    totalInnings,
    setTotalInnings,
    setPlayers,
    setTeamName,
    setHomeTeam,
    startGame,
  } = useGameStore();
  const { toast } = useToast();

  const [teamSide, setTeamSide] = useState<"home" | "away">("home");
  const [teamName, setTeamNameLocal] = useState("Pinwinos");
  const [opponentName, setOpponentName] = useState("Opponent");
  const [players, setPlayersLocal] = useState<Player[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<Player[]>([]);
  const [savedPlayersLoading, setSavedPlayersLoading] = useState(false);
  const [savedPlayersError, setSavedPlayersError] = useState<string | null>(
    null,
  );
  const [selectedSavedPlayerKey, setSelectedSavedPlayerKey] = useState("");
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerFormData>({
    name: "",
    jerseyNumber: "",
    position: "CF",
  });
  const positionOptions: PlayerPosition[] = [...Object.values(POSITIONS), "DH"];

  const teamNameKey = teamName.trim();

  useEffect(() => {
    let active = true;

    async function loadSavedPlayers() {
      if (!teamNameKey) {
        setSavedPlayers([]);
        setSavedPlayersError(null);
        return;
      }

      try {
        setSavedPlayersLoading(true);
        const response = await fetch(
          `/api/players?teamName=${encodeURIComponent(teamNameKey)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load saved players");
        }

        const data = (await response.json()) as { players?: Player[] };
        if (active) {
          setSavedPlayers(data.players || []);
          setSavedPlayersError(null);
        }
      } catch {
        if (active) {
          setSavedPlayers([]);
          setSavedPlayersError("Could not load saved players");
        }
      } finally {
        if (active) {
          setSavedPlayersLoading(false);
        }
      }
    }

    void loadSavedPlayers();

    return () => {
      active = false;
    };
  }, [teamNameKey]);

  const playerKey = (player: Player) => player.name.trim().toLowerCase();

  const lineupHasPlayer = (player: Player) =>
    players.some(
      (lineupPlayer) => playerKey(lineupPlayer) === playerKey(player),
    );

  const availableSavedPlayers = savedPlayers.filter(
    (player) => !lineupHasPlayer(player),
  );

  const savePlayersToRoster = async (playersToSave: Player[]) => {
    if (!teamNameKey || playersToSave.length === 0) {
      return;
    }

    await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: teamNameKey, players: playersToSave }),
    });

    const response = await fetch(
      `/api/players?teamName=${encodeURIComponent(teamNameKey)}`,
      { cache: "no-store" },
    );

    if (response.ok) {
      const data = (await response.json()) as { players?: Player[] };
      setSavedPlayers(data.players || []);
    }
  };

  const addSavedPlayerToLineup = (player: Player) => {
    if (lineupHasPlayer(player)) return;

    setPlayersLocal([
      ...players,
      { ...player, battingOrder: players.length + 1 },
    ]);
  };

  const addSelectedSavedPlayer = () => {
    if (!selectedSavedPlayerKey) return;

    const selectedPlayer = availableSavedPlayers.find(
      (player) => playerKey(player) === selectedSavedPlayerKey,
    );

    if (!selectedPlayer) return;

    addSavedPlayerToLineup(selectedPlayer);
    setSelectedSavedPlayerKey("");
  };

  const addAllSavedPlayers = () => {
    const nextPlayers = [...players];

    savedPlayers.forEach((player) => {
      if (
        !nextPlayers.some(
          (lineupPlayer) => playerKey(lineupPlayer) === playerKey(player),
        )
      ) {
        nextPlayers.push({ ...player, battingOrder: nextPlayers.length + 1 });
      }
    });

    setPlayersLocal(nextPlayers);
  };

  const buildNewPlayer = (battingOrder: number): Player => ({
    id: generateId(),
    name: newPlayer.name.trim(),
    jerseyNumber: newPlayer.jerseyNumber || "0",
    position: newPlayer.position,
    battingOrder,
  });

  const addPlayer = async () => {
    if (!newPlayer.name.trim()) return;

    const player = buildNewPlayer(players.length + 1);

    setPlayersLocal([...players, player]);
    await savePlayersToRoster([player]);
    setNewPlayer({ name: "", jerseyNumber: "", position: "CF" });
  };

  const savePlayerOnly = async () => {
    if (!newPlayer.name.trim()) return;

    try {
      const player = buildNewPlayer(0);
      await savePlayersToRoster([player]);
      toast({
        title: "Player saved",
        description: `${player.name} has been saved to your roster.`,
      });
      setNewPlayer({ name: "", jerseyNumber: "", position: "CF" });
    } catch (err) {
      console.error("Error saving player:", err);
      toast({
        variant: "destructive",
        title: "Error saving player",
        description: "Please check the player data and try again.",
      });
    }
  };

  const removePlayer = (playerId: string) => {
    setPlayersLocal(
      players
        .filter((player) => player.id !== playerId)
        .map((player, index) => ({ ...player, battingOrder: index + 1 })),
    );
  };

  const loadSampleTeam = () => {
    const sample = samplePlayers.pinwinos.map((player) => ({
      ...player,
      id: generateId(),
    }));

    setPlayersLocal(sample);
    setTeamNameLocal("Pinwinos");
  };

  const handleStartGame = async () => {
    if (!teamName.trim()) {
      alert("Enter a team name");
      return;
    }

    if (!opponentName.trim()) {
      alert("Enter opponent name");
      return;
    }

    if (players.length < 9) {
      alert("Your team needs at least 9 players");
      return;
    }

    await savePlayersToRoster(players);

    const opponentSide = teamSide === "home" ? "away" : "home";

    setHomeTeam(teamSide);
    setTeamName(teamSide, teamName.trim());
    setTeamName(opponentSide, opponentName.trim());
    setPlayers(teamSide, players);
    setPlayers(opponentSide, []);
    startGame();
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Pinwiscore</h1>
          <p className="text-muted-foreground">Set up your team</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(event) => setTeamNameLocal(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opponentName">Opponent Name</Label>
                <Input
                  id="opponentName"
                  placeholder="Opponent"
                  value={opponentName}
                  onChange={(event) => setOpponentName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>My Team Side</Label>
                <RadioGroup
                  value={teamSide}
                  onValueChange={(value) => {
                    const side = value as "home" | "away";
                    setTeamSide(side);
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="team-home" />
                    <Label htmlFor="team-home" className="cursor-pointer">
                      My Team is Home
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="away" id="team-away" />
                    <Label htmlFor="team-away" className="cursor-pointer">
                      My Team is Away
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Away bats first, Home bats second.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Number of Innings</Label>
              <RadioGroup
                value={totalInnings.toString()}
                onValueChange={(value) => setTotalInnings(parseInt(value))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="innings-7" />
                  <Label htmlFor="innings-7" className="cursor-pointer">
                    7 Innings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9" id="innings-9" />
                  <Label htmlFor="innings-9" className="cursor-pointer">
                    9 Innings
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <SavedGames />

        <Collapsible
          open={themeSettingsOpen}
          onOpenChange={setThemeSettingsOpen}
        >
          <div className="rounded-lg border bg-card text-card-foreground">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Theme Settings</span>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  {themeSettingsOpen ? "Hide" : "Show"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      themeSettingsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="px-4 pb-4">
              <SettingsView />
            </CollapsibleContent>
          </div>
        </Collapsible>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Lineup</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleTeam}
              className="text-xs"
            >
              <Users className="mr-1 h-3 w-3" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Add from saved players</Label>
                {savedPlayers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAllSavedPlayers}
                  >
                    Add All
                  </Button>
                )}
              </div>

              {!teamNameKey ? (
                <p className="text-sm text-muted-foreground">
                  Enter your team name to load saved players.
                </p>
              ) : savedPlayersLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading saved players...
                </p>
              ) : availableSavedPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available saved players to add.
                </p>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={selectedSavedPlayerKey}
                    onValueChange={setSelectedSavedPlayerKey}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSavedPlayers.map((player) => (
                        <SelectItem
                          key={playerKey(player)}
                          value={playerKey(player)}
                        >
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={addSelectedSavedPlayer}
                    disabled={!selectedSavedPlayerKey}
                  >
                    Add
                  </Button>
                </div>
              )}

              {savedPlayersError && (
                <p className="text-sm text-destructive">{savedPlayersError}</p>
              )}
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-sm">Add New Player</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={newPlayer.name}
                  onChange={(event) =>
                    setNewPlayer({ ...newPlayer, name: event.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="#"
                  value={newPlayer.jerseyNumber}
                  onChange={(event) =>
                    setNewPlayer({
                      ...newPlayer,
                      jerseyNumber: event.target.value,
                    })
                  }
                  className="w-16"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={newPlayer.position}
                  onValueChange={(value) =>
                    setNewPlayer({
                      ...newPlayer,
                      position: value as PlayerPosition,
                    })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addPlayer} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={savePlayerOnly}>
                  Save Only
                </Button>
              </div>
            </div>

            {players.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-16">Pos</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-mono text-muted-foreground">
                          {player.battingOrder}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{player.name}</span>
                          <span className="text-muted-foreground ml-2">
                            #{player.jerseyNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={player.position}
                            onValueChange={(value) =>
                              setPlayersLocal(
                                players.map((lineupPlayer) =>
                                  lineupPlayer.id === player.id
                                    ? {
                                        ...lineupPlayer,
                                        position: value as PlayerPosition,
                                      }
                                    : lineupPlayer,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {positionOptions.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removePlayer(player.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full h-14 text-lg font-semibold"
          onClick={handleStartGame}
          disabled={!teamName.trim() || players.length < 9}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
