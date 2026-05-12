"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OpponentRunsInput() {
  const { currentInning, isTopInning, opponentName, recordOpponentRuns } =
    useGameStore();
  const [runs, setRuns] = useState(0);

  const handleContinue = () => {
    recordOpponentRuns(runs);
    setRuns(0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="text-sm text-muted-foreground uppercase tracking-wide">
            {isTopInning ? "Top" : "Bottom"} of Inning {currentInning}
          </div>
          <CardTitle className="text-xl">Enter Opponent Runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Runs scored by {opponentName || "opponent"}
          </div>
          <Input
            type="number"
            min="0"
            max="99"
            value={runs}
            onChange={(event) =>
              setRuns(Math.max(0, parseInt(event.target.value) || 0))
            }
            className="h-14 text-center text-3xl font-bold sm:h-16 sm:text-4xl"
          />
          <Button onClick={handleContinue} className="w-full h-12" size="lg">
            Save Runs & Continue
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Enter only the number of runs scored this half inning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
