"use client";

import { useGameStore } from "@/lib/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StatsView() {
  const {
    myTeam,
    opponentName,
    getBatterStats,
    getTotalScore,
    getTotalHits,
    getTotalErrors,
  } = useGameStore();
  const myTeamKey = myTeam.isHome ? "home" : "away";
  const opponentTeamKey = myTeam.isHome ? "away" : "home";

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Team Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">R</TableHead>
                <TableHead className="text-center">H</TableHead>
                <TableHead className="text-center">E</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  {myTeam.name || "My Team"}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {getTotalScore(myTeamKey)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {getTotalHits(myTeamKey)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {getTotalErrors(myTeamKey)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  {opponentName || "Opponent"}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {getTotalScore(opponentTeamKey)}
                </TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batting Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {myTeam.name} Batting Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">Player</TableHead>
                  <TableHead className="text-center w-12">PA</TableHead>
                  <TableHead className="text-center w-12">AB</TableHead>
                  <TableHead className="text-center w-12">R</TableHead>
                  <TableHead className="text-center w-12">H</TableHead>
                  <TableHead className="text-center w-12">RBI</TableHead>
                  <TableHead className="text-center w-12">BB</TableHead>
                  <TableHead className="text-center w-12">K</TableHead>
                  <TableHead className="text-center w-16">AVG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTeam.players.map((player) => {
                  const stats = getBatterStats(player.id);
                  const avg =
                    stats.ab > 0 ? (stats.hits / stats.ab).toFixed(3) : ".000";

                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <span className="font-medium">{player.name}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.pa}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.ab}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.runs}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.hits}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.rbi}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.walks}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {stats.strikeouts}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {avg}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stat Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>
              <strong>PA</strong> - Plate Appearances
            </div>
            <div>
              <strong>AB</strong> - At Bats
            </div>
            <div>
              <strong>R</strong> - Runs
            </div>
            <div>
              <strong>H</strong> - Hits
            </div>
            <div>
              <strong>RBI</strong> - Runs Batted In
            </div>
            <div>
              <strong>BB</strong> - Walks
            </div>
            <div>
              <strong>K</strong> - Strikeouts
            </div>
            <div>
              <strong>AVG</strong> - Batting Average
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
