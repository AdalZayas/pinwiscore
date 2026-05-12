"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { Undo2, ArrowRight, Check, X } from "lucide-react";
import {
  OutType,
  HitType,
  PositionNumber,
  POSITIONS,
  Runner,
  Base,
} from "@/lib/types";

const OUT_TYPES: { value: OutType; label: string }[] = [
  { value: "groundout", label: "Groundout" },
  { value: "flyout", label: "Flyout" },
  { value: "lineout", label: "Lineout" },
  { value: "popout", label: "Popout" },
  { value: "strikeout-swinging", label: "K (Swinging)" },
  { value: "strikeout-looking", label: "Ꝁ (Looking)" },
  { value: "force-out", label: "Force Out" },
  { value: "tag-out", label: "Tag Out" },
  { value: "double-play", label: "Double Play" },
  { value: "fielders-choice", label: "Fielder's Choice" },
  { value: "sacrifice-fly", label: "Sacrifice Fly" },
  { value: "sacrifice-bunt", label: "Sacrifice Bunt" },
];

const HIT_TYPES: { value: HitType; label: string; short: string }[] = [
  { value: "single", label: "Single", short: "1B" },
  { value: "double", label: "Double", short: "2B" },
  { value: "triple", label: "Triple", short: "3B" },
  { value: "home-run", label: "Home Run", short: "HR" },
];

export function AdvancedMode() {
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
    recordOut,
    recordHit,
    recordWalk,
    recordHitByPitch,
    recordError,
    recordStolenBase,
    recordRunScores,
    recordRunnerOut,
    endMyTeamBatting,
    undoLastPlay,
  } = useGameStore();

  const [selectedOutType, setSelectedOutType] = useState<OutType>("groundout");
  const [selectedHitType, setSelectedHitType] = useState<HitType>("single");
  const [fieldingPositions, setFieldingPositions] = useState<PositionNumber[]>(
    [],
  );
  const [errorPosition, setErrorPosition] = useState<PositionNumber>(5);
  const [isEarnedRun, setIsEarnedRun] = useState(true);
  const [notes, setNotes] = useState("");
  const [stealingRunner, setStealingRunner] = useState<Runner | null>(null);
  const [stealToBase, setStealToBase] = useState<Base | null>(null);

  const currentBatter = getCurrentBatter();

  const toggleFieldingPosition = (pos: PositionNumber) => {
    if (fieldingPositions.includes(pos)) {
      setFieldingPositions(fieldingPositions.filter((p) => p !== pos));
    } else {
      setFieldingPositions([...fieldingPositions, pos]);
    }
  };

  const handleRecordOut = () => {
    recordOut(
      selectedOutType,
      fieldingPositions.length > 0 ? fieldingPositions : undefined,
    );
    setFieldingPositions([]);
    setNotes("");
  };

  const handleRecordHit = () => {
    recordHit(selectedHitType);
    setFieldingPositions([]);
    setNotes("");
  };

  const handleRecordError = () => {
    recordError(errorPosition);
    setNotes("");
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

  const formatFieldingPlay = () => {
    if (fieldingPositions.length === 0) return "";
    return fieldingPositions.join("-");
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
          <div className="text-sm">
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

      {/* Out Recording */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Record Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Out Type</Label>
              <Select
                value={selectedOutType}
                onValueChange={(v) => setSelectedOutType(v as OutType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">
                Fielding: {formatFieldingPlay() || "None"}
              </Label>
              <div className="flex flex-wrap gap-1">
                {Object.entries(POSITIONS).map(([num]) => (
                  <Button
                    key={num}
                    variant={
                      fieldingPositions.includes(Number(num) as PositionNumber)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="w-8 h-8 p-0 text-xs"
                    onClick={() =>
                      toggleFieldingPosition(Number(num) as PositionNumber)
                    }
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={handleRecordOut}>
            Record Out ({formatFieldingPlay() || selectedOutType})
          </Button>
        </CardContent>
      </Card>

      {/* Hit Recording */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Record Hit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {HIT_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={selectedHitType === type.value ? "default" : "outline"}
                onClick={() => setSelectedHitType(type.value)}
                className="h-12"
              >
                {type.short}
              </Button>
            ))}
          </div>
          <Button
            className="w-full"
            variant="secondary"
            onClick={handleRecordHit}
          >
            Record {HIT_TYPES.find((t) => t.value === selectedHitType)?.label}
          </Button>
        </CardContent>
      </Card>

      {/* Other Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            Other Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={recordWalk}>
              Walk (BB)
            </Button>
            <Button variant="outline" onClick={recordHitByPitch}>
              Hit by Pitch (HBP)
            </Button>
            <Button variant="outline" onClick={() => recordOut("double-play")}>
              Double Play
            </Button>
            <Button
              variant="outline"
              onClick={() => recordOut("fielders-choice")}
            >
              Fielder&apos;s Choice
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={errorPosition.toString()}
              onValueChange={(v) =>
                setErrorPosition(Number(v) as PositionNumber)
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POSITIONS).map(([num, pos]) => (
                  <SelectItem key={num} value={num}>
                    E{num} ({pos})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRecordError}>
              Record Error
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
                  className="space-y-2 p-2 bg-muted/30 rounded"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
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
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {canSteal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleStealAttempt(runner)}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Steal {nextBase}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={() =>
                        recordRunScores(runner.playerId, isEarnedRun)
                      }
                    >
                      Score {isEarnedRun ? "(ER)" : "(UER)"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => recordRunnerOut(runner.playerId)}
                    >
                      Out
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`earned-${runner.playerId}`}
                      checked={isEarnedRun}
                      onCheckedChange={(c) => setIsEarnedRun(c === true)}
                    />
                    <Label
                      htmlFor={`earned-${runner.playerId}`}
                      className="text-xs"
                    >
                      Earned Run
                    </Label>
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

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes for this play..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20"
          />
        </CardContent>
      </Card>

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
    </div>
  );
}
