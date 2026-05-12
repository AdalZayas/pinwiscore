"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scoreboard } from "./scoreboard";
import { Scorecard } from "./scorecard";
import { PlayByPlay } from "./play-by-play";
import { StatsView } from "./stats-view";

export function GameFinished() {
  const { id, myTeam, opponentName, getTotalScore, exportJSON, resetGame } =
    useGameStore();
  const lastSavedIdRef = useRef<string | null>(null);
  const myTeamKey = myTeam.isHome ? "home" : "away";
  const opponentTeamKey = myTeam.isHome ? "away" : "home";

  const myScore = getTotalScore(myTeamKey);
  const opponentScore = getTotalScore(opponentTeamKey);

  useEffect(() => {
    if (!id || lastSavedIdRef.current === id) return;

    lastSavedIdRef.current = id;

    const game = JSON.parse(exportJSON()) as Record<string, unknown>;
    void fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game }),
    });
  }, [id, exportJSON]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="mx-auto w-full max-w-5xl p-3 sm:p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Final Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {myTeam.name || "My Team"}
                </div>
                <div className="text-4xl font-bold font-mono">{myScore}</div>
              </div>
              <div className="pb-2 text-muted-foreground">-</div>
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {opponentName || "Opponent"}
                </div>
                <div className="text-4xl font-bold font-mono">
                  {opponentScore}
                </div>
              </div>
            </div>

            <Button className="mt-4 w-full" size="lg" onClick={resetGame}>
              New Game
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="inning" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-4">
            <TabsTrigger
              value="inning"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Innings
            </TabsTrigger>
            <TabsTrigger
              value="scorecard"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Scorecard
            </TabsTrigger>
            <TabsTrigger
              value="plays"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Plays
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inning">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Inning by Inning</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Scoreboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecard">
            <Scorecard />
          </TabsContent>

          <TabsContent value="plays">
            <PlayByPlay />
          </TabsContent>

          <TabsContent value="stats">
            <StatsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
