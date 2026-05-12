"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Undo2, ArrowRight, Check, X } from "lucide-react";
import { Runner, Base, HitType } from "@/lib/types";

export function SimpleMode() {
  const {
    balls,
    strikes,
    outs,
    runners,
    currentInning,
    isMyTeamBatting,
    myTeam,
    plays,
    getCurrentBatter,
    recordBall,
    recordStrike,
    recordFoul,
    recordOut,
    recordHit,
    recordHitWithCustomRunners,
    recordWalk,
    recordHitByPitch,
    recordError,
    recordStolenBase,
    recordRunScores,
    recordRunnerOut,
    endMyTeamBatting,
    undoLastPlay,
  } = useGameStore();

  const [stealingRunner, setStealingRunner] = useState<Runner | null>(null);
  const [stealToBase, setStealToBase] = useState<Base | null>(null);
  const [pendingHit, setPendingHit] = useState<HitType | null>(null);
  const [runnersNotAdvancing, setRunnersNotAdvancing] = useState<Set<string>>(
    new Set(),
  );

  const currentBatter = getCurrentBatter();

  const handleStrike = () => {
    if (strikes >= 2) {
      recordOut("strikeout-swinging");
    } else {
      recordStrike();
    }
  };

  const handleBall = () => {
    if (balls >= 3) {
      recordWalk();
    } else {
      recordBall();
    }
  };

  const handleHitClick = (hitType: HitType) => {
    // If there are runners, show dialog to select which shouldn't advance
    if (runners.length > 0) {
      setPendingHit(hitType);
      setRunnersNotAdvancing(new Set());
    } else {
      recordHit(hitType);
    }
  };

  const handleConfirmHit = () => {
    if (!pendingHit) return;

    if (runnersNotAdvancing.size === 0) {
      recordHit(pendingHit);
    } else {
      recordHitWithCustomRunners(pendingHit, Array.from(runnersNotAdvancing));
    }

    setPendingHit(null);
    setRunnersNotAdvancing(new Set());
  };

  const toggleRunnerAdvancement = (runnerId: string) => {
    const newSet = new Set(runnersNotAdvancing);
    if (newSet.has(runnerId)) {
      newSet.delete(runnerId);
    } else {
      newSet.add(runnerId);
    }
    setRunnersNotAdvancing(newSet);
  };

  const getPlayerName = (playerId: string) => {
    return myTeam.players.find((p) => p.id === playerId)?.name || "Unknown";
  };

  const getBaseLabel = (base: Base) => {
    return base === "first" ? "1B" : base === "second" ? "2B" : "3B";
  };

  const handleStealAttempt = (runner: Runner) => {
    const nextBase: Base =
      runner.base === "first"
        ? "second"
        : runner.base === "second"
          ? "third"
          : "first";
    setStealingRunner(runner);
    setStealToBase(nextBase);
  };

  const handleStealResult = (isSafe: boolean) => {
    if (stealingRunner && stealToBase) {
      recordStolenBase(stealingRunner, stealToBase, isSafe);
    }
    setStealingRunner(null);
    setStealToBase(null);
  };

  const getPlayer = (playerId: string) =>
    myTeam.players.find((p) => p.id === playerId);

  return (
    <div className="space-y-4">
      {/* Current At-Bat Info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inning {currentInning}</CardTitle>
            <Badge
              variant={isMyTeamBatting ? "default" : "secondary"}
              className="font-mono animate-pulse"
            >
              {myTeam.name} batting
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">At Bat:</span>{" "}
              <span className="font-medium">
                {currentBatter?.name || "Unknown"}
              </span>
              {currentBatter && (
                <span className="text-muted-foreground ml-1">
                  #{currentBatter.jerseyNumber}
                </span>
              )}
            </div>
          </div>

          {/* Count Display */}
          <div className="flex items-center justify-around py-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Balls
              </div>
              <div className="flex gap-1 mt-1 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i < balls ? "bg-chart-3" : "bg-muted-foreground/20",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Strikes
              </div>
              <div className="flex gap-1 mt-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i < strikes ? "bg-destructive" : "bg-muted-foreground/20",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Outs
              </div>
              <div className="flex gap-1 mt-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      i < outs ? "bg-foreground" : "bg-muted-foreground/20",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="h-14 text-lg font-semibold bg-chart-3/10 border-chart-3/30 hover:bg-chart-3/20"
          onClick={handleBall}
        >
          Ball
        </Button>
        <Button
          variant="outline"
          className="h-14 text-lg font-semibold bg-destructive/10 border-destructive/30 hover:bg-destructive/20"
          onClick={handleStrike}
        >
          Strike
        </Button>
        <Button
          variant="outline"
          className="h-14 text-lg font-semibold"
          onClick={recordFoul}
        >
          Foul
        </Button>
      </div>

      {/* Hit Buttons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Hits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="secondary"
              className="h-12 font-semibold"
              onClick={() => handleHitClick("single")}
            >
              1B
            </Button>
            <Button
              variant="secondary"
              className="h-12 font-semibold"
              onClick={() => handleHitClick("double")}
            >
              2B
            </Button>
            <Button
              variant="secondary"
              className="h-12 font-semibold"
              onClick={() => handleHitClick("triple")}
            >
              3B
            </Button>
            <Button
              className="h-12 font-semibold bg-primary hover:bg-primary/90"
              onClick={() => handleHitClick("home-run")}
            >
              HR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Other Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Other Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="h-11" onClick={recordWalk}>
              Walk
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={recordHitByPitch}
            >
              HBP
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("groundout", [6, 3])}
            >
              Ground Out
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("flyout")}
            >
              Fly Out
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("lineout")}
            >
              Line Out
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordError(5)}
            >
              Error
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("strikeout-swinging")}
            >
              K
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("strikeout-looking")}
            >
              <span className="transform scale-x-[-1]">K</span>
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("double-play")}
            >
              DP
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => recordOut("fielders-choice")}
            >
              FC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Runner Actions */}
      {runners.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Runners on Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {runners.map((runner) => {
              const player = getPlayer(runner.playerId);
              const nextBaseValue =
                runner.base === "first"
                  ? "second"
                  : runner.base === "second"
                    ? "third"
                    : null;
              const canSteal =
                nextBaseValue !== null &&
                !runners.some(
                  (otherRunner) => otherRunner.base === nextBaseValue,
                );
              const nextBase =
                nextBaseValue === "second"
                  ? "2nd"
                  : nextBaseValue === "third"
                    ? "3rd"
                    : "Home";

              return (
                <div
                  key={runner.playerId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-sm">
                      {runner.base === "first"
                        ? "1B"
                        : runner.base === "second"
                          ? "2B"
                          : "3B"}
                    </Badge>
                    <span className="text-sm font-medium">
                      {player?.name || "Runner"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {canSteal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleStealAttempt(runner)}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Steal {nextBase}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-primary"
                      onClick={() => recordRunScores(runner.playerId)}
                    >
                      Score
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive"
                      onClick={() => recordRunnerOut(runner.playerId)}
                    >
                      Out
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Steal Attempt Dialog */}
      <Dialog
        open={!!stealingRunner}
        onOpenChange={() => setStealingRunner(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Steal Attempt</DialogTitle>
            <DialogDescription>
              {getPlayer(stealingRunner?.playerId || "")?.name || "Runner"}{" "}
              attempting to steal{" "}
              {stealToBase === "second"
                ? "2nd"
                : stealToBase === "third"
                  ? "3rd"
                  : "home"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button
              variant="default"
              className="flex-1 h-14 text-lg gap-2"
              onClick={() => handleStealResult(true)}
            >
              <Check className="h-5 w-5" />
              Safe
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-14 text-lg gap-2"
              onClick={() => handleStealResult(false)}
            >
              <X className="h-5 w-5" />
              Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Inning / Undo */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={undoLastPlay}
          disabled={plays.length === 0}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Undo
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="flex-1 h-12">
              End Batting
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Batting?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all runners and move to enter the
                opponent&apos;s runs for this inning.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={endMyTeamBatting}>
                End Batting
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Runner Advancement Dialog */}
      <Dialog
        open={!!pendingHit}
        onOpenChange={(open) => !open && setPendingHit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Runner Advancement</DialogTitle>
            <DialogDescription>
              Select any runners who should NOT advance on this hit:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {runners.map((runner) => (
              <div
                key={runner.playerId}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <Checkbox
                  id={`runner-${runner.playerId}`}
                  checked={runnersNotAdvancing.has(runner.playerId)}
                  onCheckedChange={() =>
                    toggleRunnerAdvancement(runner.playerId)
                  }
                />
                <Label
                  htmlFor={`runner-${runner.playerId}`}
                  className="flex-1 cursor-pointer font-medium"
                >
                  {getPlayerName(runner.playerId)} on{" "}
                  {getBaseLabel(runner.base)}
                </Label>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingHit(null);
                setRunnersNotAdvancing(new Set());
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmHit}>Confirm Hit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
