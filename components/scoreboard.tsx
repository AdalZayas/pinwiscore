"use client";

import { useGameStore } from "@/lib/game-store";
import { cn } from "@/lib/utils";

export function Scoreboard() {
  const {
    status,
    myTeam,
    opponentName,
    isMyTeamHome,
    inningScores,
    currentInning,
    isMyTeamBatting,
    totalInnings,
    getTotalScore,
    getTotalHits,
    getTotalErrors,
  } = useGameStore();
  const myTeamKey = isMyTeamHome ? "home" : "away";
  const opponentTeamKey = isMyTeamHome ? "away" : "home";

  const displayInnings = inningScores.slice(
    0,
    Math.max(currentInning, totalInnings),
  );

  // If my team is home, opponent bats first (top), my team bats second (bottom)
  // If my team is away, my team bats first (top), opponent bats second (bottom)
  const awayTeamName = isMyTeamHome ? opponentName : myTeam.name;
  const homeTeamName = isMyTeamHome ? myTeam.name : opponentName;

  const isTopInning = isMyTeamHome ? !isMyTeamBatting : isMyTeamBatting;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-2 font-semibold min-w-24">Team</th>
            {displayInnings.map((_, i) => (
              <th
                key={i}
                className={cn(
                  "p-2 w-8 text-center font-mono",
                  currentInning === i + 1 && "bg-primary/20 text-primary",
                )}
              >
                {i + 1}
              </th>
            ))}
            <th className="p-2 w-10 text-center font-semibold bg-muted">R</th>
            <th className="p-2 w-10 text-center font-semibold bg-muted">H</th>
            <th className="p-2 w-10 text-center font-semibold bg-muted">E</th>
          </tr>
        </thead>
        <tbody>
          {/* Away Team (top of inning) */}
          <tr
            className={cn(
              "border-b border-border",
              isTopInning && "bg-primary/5",
            )}
          >
            <td className="p-2 font-medium">
              <div className="flex items-center gap-2">
                {isTopInning && (
                  <span className="w-0 h-0 border-l-[6px] border-l-primary border-y-4 border-y-transparent" />
                )}
                <span className={cn(!isTopInning && "ml-4")}>
                  {awayTeamName || "Away"}
                </span>
              </div>
            </td>
            {displayInnings.map((inning, i) => {
              const score = inning["away"];
              const showScore =
                status === "finished" ||
                currentInning > i + 1 ||
                (currentInning === i + 1 && !isTopInning);
              const isCurrent = currentInning === i + 1 && isTopInning;

              return (
                <td
                  key={i}
                  className={cn(
                    "p-2 text-center font-mono",
                    currentInning === i + 1 && "bg-primary/20",
                  )}
                >
                  {showScore ? score : isCurrent ? (score ?? "-") : ""}
                </td>
              );
            })}
            <td className="p-2 text-center font-mono font-bold bg-muted">
              {getTotalScore(opponentTeamKey)}
            </td>
            <td className="p-2 text-center font-mono bg-muted">
              {isMyTeamHome ? "-" : getTotalHits(opponentTeamKey)}
            </td>
            <td className="p-2 text-center font-mono bg-muted">
              {isMyTeamHome ? "-" : getTotalErrors(opponentTeamKey)}
            </td>
          </tr>

          {/* Home Team (bottom of inning) */}
          <tr className={cn(!isTopInning && "bg-primary/5")}>
            <td className="p-2 font-medium">
              <div className="flex items-center gap-2">
                {!isTopInning && (
                  <span className="w-0 h-0 border-l-[6px] border-l-primary border-y-4 border-y-transparent" />
                )}
                <span className={cn(isTopInning && "ml-4")}>
                  {homeTeamName || "Home"}
                </span>
              </div>
            </td>
            {displayInnings.map((inning, i) => {
              const score = inning["home"];
              const showScore = status === "finished" || currentInning > i + 1;
              const isCurrent = currentInning === i + 1 && !isTopInning;

              return (
                <td
                  key={i}
                  className={cn(
                    "p-2 text-center font-mono",
                    currentInning === i + 1 && "bg-primary/20",
                  )}
                >
                  {showScore ? score : isCurrent ? (score ?? "-") : ""}
                </td>
              );
            })}
            <td className="p-2 text-center font-mono font-bold bg-muted">
              {getTotalScore(myTeamKey)}
            </td>
            <td className="p-2 text-center font-mono bg-muted">
              {isMyTeamHome ? getTotalHits(myTeamKey) : "-"}
            </td>
            <td className="p-2 text-center font-mono bg-muted">
              {isMyTeamHome ? getTotalErrors(myTeamKey) : "-"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
