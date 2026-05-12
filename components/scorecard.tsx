"use client";

import { useGameStore } from "@/lib/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Play, PlateAppearance } from "@/lib/types";

function getPlaySymbol(play: Play): string {
  switch (play.result) {
    case "single":
      return "1B";
    case "double":
      return "2B";
    case "triple":
      return "3B";
    case "home-run":
      return "HR";
    case "walk":
      return "BB";
    case "hit-by-pitch":
      return "HBP";
    case "error":
      return `E${play.errorPosition || ""}`;
    case "out":
      if (play.outType?.includes("strikeout-swinging")) return "K";
      if (play.outType?.includes("strikeout-looking")) return "Ꝁ";
      if (play.outType === "double-play") return "DP";
      if (play.outType === "fielders-choice") return "FC";
      if (play.fieldingPositions && play.fieldingPositions.length > 0) {
        return play.fieldingPositions.join("-");
      }
      if (play.outType === "flyout") return "F";
      if (play.outType === "lineout") return "L";
      if (play.outType === "popout") return "P";
      if (play.outType === "groundout") return "GO";
      return "OUT";
    default:
      return "";
  }
}

function isPlateAppearanceResult(result: string): boolean {
  return [
    "single",
    "double",
    "triple",
    "home-run",
    "walk",
    "hit-by-pitch",
    "error",
    "out",
  ].includes(result);
}

export function Scorecard() {
  const { myTeam, plays, totalInnings, currentInning } = useGameStore();

  const getPlateAppearances = (
    playerId: string,
  ): Map<number, PlateAppearance[]> => {
    const appearances = new Map<number, PlateAppearance[]>();

    plays
      .filter(
        (p) => p.batterId === playerId && isPlateAppearanceResult(p.result),
      )
      .forEach((play) => {
        const inning = play.inning;
        if (!appearances.has(inning)) {
          appearances.set(inning, []);
        }
        appearances.get(inning)!.push({
          inning: play.inning,
          result: getPlaySymbol(play),
          rbi: play.rbiCount,
          runs: play.runnerMovements?.filter((m) => m.to === "scored").length,
        });
      });

    return appearances;
  };

  const innings = Array.from(
    { length: Math.max(totalInnings, currentInning) },
    (_, i) => i + 1,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{myTeam.name} Scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium min-w-8">#</th>
                <th className="text-left p-2 font-medium min-w-32">Player</th>
                <th className="text-center p-2 font-medium w-10">Pos</th>
                {innings.map((inning) => (
                  <th
                    key={inning}
                    className="text-center p-2 font-mono min-w-14 border-l border-border"
                  >
                    {inning}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTeam.players.map((player) => {
                const appearances = getPlateAppearances(player.id);

                return (
                  <tr
                    key={player.id}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="p-2 text-muted-foreground font-mono text-xs">
                      {player.battingOrder}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {player.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          #{player.jerseyNumber}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="text-xs font-mono">
                        {player.position}
                      </Badge>
                    </td>
                    {innings.map((inning) => {
                      const inningAppearances = appearances.get(inning) || [];

                      return (
                        <td
                          key={inning}
                          className="p-1 text-center border-l border-border min-h-12"
                        >
                          <div className="flex flex-col gap-1">
                            {inningAppearances.map((pa, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "px-1 py-0.5 rounded text-xs font-mono",
                                  pa.result.startsWith("1B") ||
                                    pa.result.startsWith("2B") ||
                                    pa.result.startsWith("3B") ||
                                    pa.result === "HR"
                                    ? "bg-primary/20 text-primary"
                                    : pa.result === "BB" || pa.result === "HBP"
                                      ? "bg-chart-3/20 text-chart-3"
                                      : pa.result.startsWith("E")
                                        ? "bg-chart-4/20 text-chart-4"
                                        : "bg-muted text-muted-foreground",
                                )}
                              >
                                {pa.result}
                                {pa.rbi && pa.rbi > 0 && (
                                  <span className="ml-0.5 text-primary">
                                    {pa.rbi}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary/20 rounded" />
            <span>Hit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-chart-3/20 rounded" />
            <span>Walk/HBP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-chart-4/20 rounded" />
            <span>Error</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted rounded" />
            <span>Out</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-primary font-bold">2</span>
            <span>RBI count</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
