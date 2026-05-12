"use client";

import { useGameStore } from "@/lib/game-store";
import { POSITIONS, type PlayerPosition } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function LineupView() {
  const { myTeam, currentBatterIndex, isMyTeamBatting, updatePlayerPosition } =
    useGameStore();
  const battingIndex = currentBatterIndex[myTeam.isHome ? "home" : "away"];
  const teamKey = myTeam.isHome ? "home" : "away";
  const positionOptions: PlayerPosition[] = [...Object.values(POSITIONS), "DH"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{myTeam.name} Lineup</CardTitle>
          {isMyTeamBatting && (
            <Badge variant="default" className="text-xs">
              Now Batting
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="w-16">Pos</TableHead>
              <TableHead className="w-16 text-right">Jersey</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myTeam.players.map((player, index) => (
              <TableRow
                key={player.id}
                className={
                  isMyTeamBatting && index === battingIndex
                    ? "bg-primary/10 border-l-2 border-l-primary animate-pulse"
                    : ""
                }
              >
                <TableCell className="font-mono text-muted-foreground">
                  {player.battingOrder}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    {isMyTeamBatting && index === battingIndex && (
                      <Badge variant="secondary" className="text-xs">
                        At Bat
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={player.position}
                    onValueChange={(value) =>
                      updatePlayerPosition(
                        teamKey,
                        player.id,
                        value as PlayerPosition,
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-20 font-mono">
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
                <TableCell className="text-right font-mono text-muted-foreground">
                  #{player.jerseyNumber}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
