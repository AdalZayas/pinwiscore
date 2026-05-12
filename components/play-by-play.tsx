"use client";

import { useGameStore } from "@/lib/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Team } from "@/lib/types";

function formatPlayDescription(play: Play, myTeam: Team): string {
  const batter = myTeam.players.find((player) => player.id === play.batterId);
  const batterName = batter?.name || "Unknown";

  let description = `${batterName} `;

  switch (play.result) {
    case "single":
      description += "singles";
      break;
    case "double":
      description += "doubles";
      break;
    case "triple":
      description += "triples";
      break;
    case "home-run":
      description += "homers";
      break;
    case "walk":
      description += "walks";
      break;
    case "hit-by-pitch":
      description += "hit by pitch";
      break;
    case "error":
      description += `reaches on error (E${play.errorPosition || ""})`;
      break;
    case "out":
      if (play.outType?.includes("strikeout-swinging")) {
        description += "strikes out swinging";
      } else if (play.outType?.includes("strikeout-looking")) {
        description += "strikes out looking";
      } else if (play.outType === "double-play") {
        description += "hits into a double play";
      } else if (play.outType === "fielders-choice") {
        description += "reaches on fielder's choice";
      } else if (play.fieldingPositions && play.fieldingPositions.length > 0) {
        const positions = play.fieldingPositions.join("-");
        if (play.outType === "groundout") {
          description += `grounds out (${positions})`;
        } else if (play.outType === "flyout") {
          description += `flies out (F${positions})`;
        } else if (play.outType === "lineout") {
          description += `lines out (L${positions})`;
        } else if (play.outType === "popout") {
          description += `pops out (P${positions})`;
        } else {
          description += `out (${positions})`;
        }
      } else {
        description += "is out";
      }
      break;
    case "stolen-base":
      const sbRunner = myTeam.players.find((player) =>
        play.runnerMovements?.some(
          (movement) => movement.playerId === player.id,
        ),
      );
      description = `${sbRunner?.name || "Runner"} steals base`;
      break;
    case "caught-stealing":
      const csRunner = myTeam.players.find((player) =>
        play.runnerMovements?.some(
          (movement) => movement.playerId === player.id,
        ),
      );
      description = `${csRunner?.name || "Runner"} caught stealing`;
      break;
    case "run-scores":
      const scorer = myTeam.players.find((player) =>
        play.runnerMovements?.some(
          (movement) => movement.playerId === player.id,
        ),
      );
      description = `${scorer?.name || "Runner"} scores`;
      break;
    case "opponent-runs":
      description = `Opponent scores ${play.opponentRuns || 0} run${(play.opponentRuns || 0) !== 1 ? "s" : ""}`;
      break;
    case "runner-out":
      description = "Runner is out";
      break;
    default:
      if (play.result === "ball") {
        description += "takes ball";
      } else if (play.result === "strike") {
        description += "takes strike";
      } else if (play.result === "foul") {
        description += "fouls off";
      } else {
        description += play.result;
      }
  }

  if (play.rbiCount && play.rbiCount > 0) {
    description += ` (${play.rbiCount} RBI)`;
  }

  return description;
}

export function PlayByPlay() {
  const { plays, myTeam, opponentName } = useGameStore();
  const myTeamKey = myTeam.isHome ? "home" : "away";
  const opponentTeamKey = myTeam.isHome ? "away" : "home";

  const significantPlays = plays.filter((p) =>
    [
      "single",
      "double",
      "triple",
      "home-run",
      "walk",
      "hit-by-pitch",
      "error",
      "out",
      "stolen-base",
      "caught-stealing",
      "run-scores",
      "opponent-runs",
    ].includes(p.result),
  );

  const playsByInning = significantPlays.reduce(
    (acc, play) => {
      const key = `${play.inning}`;
      if (!acc[key]) {
        acc[key] = {
          inning: play.inning,
          plays: [],
        };
      }
      acc[key].plays.push(play);
      return acc;
    },
    {} as Record<string, { inning: number; plays: Play[] }>,
  );

  const sortedInnings = Object.values(playsByInning).sort(
    (a, b) => a.inning - b.inning,
  );

  if (significantPlays.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No plays recorded yet. Start the game to see the play-by-play log.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Play-by-Play</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-125 pr-4">
          <div className="space-y-6">
            {sortedInnings.map((inningData) => (
              <div key={inningData.inning}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="font-mono">
                    Inning {inningData.inning}
                  </Badge>
                </div>
                <div className="space-y-2 ml-2 border-l-2 border-border pl-4">
                  {inningData.plays.map((play, index) => (
                    <div key={play.id} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground font-mono text-xs w-8 pt-0.5">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p>{formatPlayDescription(play, myTeam)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Score: {myTeam.name} {play.scoreAfter[myTeamKey]} -{" "}
                            {opponentName} {play.scoreAfter[opponentTeamKey]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
