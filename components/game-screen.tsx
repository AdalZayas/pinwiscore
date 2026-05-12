"use client";

import { useGameStore } from "@/lib/game-store";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Scoreboard } from "./scoreboard";
import { SimpleMode } from "./simple-mode";
import { AdvancedMode } from "./advanced-mode";
import { Scorecard } from "./scorecard";
import { LineupView } from "./lineup-view";
import { PlayByPlay } from "./play-by-play";
import { StatsView } from "./stats-view";
import { BatterTransition } from "./batter-transition";
import { BaseballDiamond } from "./baseball-diamond";

export function GameScreen() {
  const {
    mode,
    myTeam,
    getTotalScore,
    isMyTeamHome,
    opponentName,
    setMode,
    isMyTeamBatting,
    currentInning,
    balls,
    strikes,
    outs,
    getCurrentBatter,
  } = useGameStore();

  const myTeamKey = isMyTeamHome ? "home" : "away";
  const opponentTeamKey = isMyTeamHome ? "away" : "home";
  const opponentScore = getTotalScore(opponentTeamKey);
  const myTeamScore = getTotalScore(myTeamKey);
  return (
    <div className="min-h-screen bg-background pb-4">
      <BatterTransition />

      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
              <span className="font-semibold text-primary">
                Inn {currentInning}
              </span>
              <span className="font-mono text-muted-foreground">
                B-S: {balls}-{strikes}
              </span>
              <span className="font-mono text-muted-foreground">
                Outs: {outs}
              </span>
            </div>
            <div className="truncate text-sm font-medium">
              {isMyTeamBatting
                ? (() => {
                    const b = getCurrentBatter();
                    return b ? `🔴 ${b.name} #${b.jerseyNumber}` : "🔴 At bat";
                  })()
                : "⚪ Opponent batting"}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Score:
              <span className="ml-1 font-medium text-primary">
                {myTeam.name} {myTeamScore}
              </span>
              <span className="mx-1">-</span>
              <span className="font-medium text-primary">
                {opponentName} {opponentScore}
              </span>
            </div>
          </div>
          <BaseballDiamond />
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-3 sm:px-4">
        <Tabs defaultValue="score" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-5">
            <TabsTrigger
              value="score"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Score
            </TabsTrigger>
            <TabsTrigger
              value="scorecard"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Card
            </TabsTrigger>
            <TabsTrigger
              value="lineup"
              className="px-1 text-xs sm:px-2 sm:text-sm"
            >
              Lineup
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

          <TabsContent value="score" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="mode-toggle"
                className="text-sm text-muted-foreground"
              >
                {mode === "simple" ? "Simple Mode" : "Advanced Mode"}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Simple</span>
                <Switch
                  id="mode-toggle"
                  checked={mode === "advanced"}
                  onCheckedChange={(checked) =>
                    setMode(checked ? "advanced" : "simple")
                  }
                />
                <span className="text-xs text-muted-foreground">Advanced</span>
              </div>
            </div>

            <Card className="hidden md:block">
              <CardContent className="p-2 flex">
                <Scoreboard />
                <BaseballDiamond />
              </CardContent>
            </Card>

            <div className="md:grid md:grid-cols-2 md:items-start md:gap-4">
              <div className="space-y-4">
                {mode === "simple" ? <SimpleMode /> : <AdvancedMode />}
              </div>

              <div className="hidden md:block md:space-y-4">
                <LineupView />
                <PlayByPlay />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scorecard">
            <Scorecard />
          </TabsContent>

          <TabsContent value="lineup">
            <LineupView />
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
