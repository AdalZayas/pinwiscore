"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  Play,
  PlayResult,
  Runner,
  Base,
  OutType,
  HitType,
  PositionNumber,
  Player,
  PlayerPosition,
  Team,
  BatterStats,
  PitcherStats,
} from "./types";
import { createEmptyGameState } from "./types";
import { generateId } from "./utils";

interface GameStore extends GameState {
  myTeam: Team;
  opponentName: string;
  isMyTeamHome: boolean;
  isMyTeamBatting: boolean;
  legacyCurrentBatterIndex: number;
  showBatterTransition: boolean;
  nextBatterName: string;
  primaryColor: string;
  secondaryColor: string;

  // Actions
  setTeamName: (team: "away" | "home", name: string) => void;
  setHomeTeam: (team: "away" | "home") => void;
  setTotalInnings: (innings: number) => void;
  setPlayers: (team: "away" | "home", players: Player[]) => void;
  updatePlayerPosition: (
    team: "away" | "home",
    playerId: string,
    position: PlayerPosition,
  ) => void;
  startGame: () => void;
  setMode: (mode: "simple" | "advanced") => void;
  setThemeColors: (primaryColor: string, secondaryColor: string) => void;
  resetThemeColors: () => void;

  // Simple mode actions
  recordBall: () => void;
  recordStrike: () => void;
  recordFoul: () => void;
  recordOut: (outType?: OutType, fieldingPositions?: PositionNumber[]) => void;
  recordHit: (hitType: HitType) => void;
  recordWalk: () => void;
  recordHitByPitch: () => void;
  recordError: (position?: PositionNumber) => void;
  recordStolenBase: (runner: Runner, toBase: Base, isSafe?: boolean) => void;
  recordCaughtStealing: (runner: Runner) => void;
  recordRunScores: (runnerId: string, isEarned?: boolean) => void;
  recordOpponentRuns: (runs: number) => void;
  recordRunnerOut: (runnerId: string) => void;
  advanceRunner: (runnerId: string, toBase: Base | "home") => void;
  nextBatter: () => void;
  endHalfInning: () => void;
  endMyTeamBatting: () => void;
  undoLastPlay: () => void;

  // Advanced mode
  recordAdvancedPlay: (play: Partial<Play>) => void;

  // Utilities
  resetGame: () => void;
  dismissBatterTransition: () => void;
  exportJSON: () => string;
  loadGameSnapshot: (
    snapshot: Partial<GameState> & Partial<ThemeStoreFields>,
  ) => void;
  getCurrentBatter: () => Player | null;
  getCurrentPitcher: () => Player | null;
  getBattingTeam: () => "away" | "home";
  getFieldingTeam: () => "away" | "home";
  getTotalScore: (team: "away" | "home") => number;
  getTotalHits: (team: "away" | "home") => number;
  getTotalErrors: (team: "away" | "home") => number;
  getBatterStats: (playerId: string) => BatterStats;
  getPitcherStats: (playerId: string) => PitcherStats;
}

type LegacyStoreFields = Pick<
  GameStore,
  | "myTeam"
  | "opponentName"
  | "isMyTeamHome"
  | "isMyTeamBatting"
  | "legacyCurrentBatterIndex"
  | "showBatterTransition"
  | "nextBatterName"
>;

type ThemeStoreFields = Pick<GameStore, "primaryColor" | "secondaryColor">;

function getLegacyTeams(state: GameState) {
  const myTeam = state.homeTeam.isHome ? state.homeTeam : state.awayTeam;
  const opponentTeam = state.homeTeam.isHome ? state.awayTeam : state.homeTeam;

  return {
    myTeam,
    opponentTeam,
    isMyTeamHome: myTeam.isHome,
    isMyTeamBatting: state.isTopInning ? !myTeam.isHome : myTeam.isHome,
    legacyCurrentBatterIndex:
      state.currentBatterIndex[myTeam.isHome ? "home" : "away"],
  };
}

function createLegacyState(state: GameState): LegacyStoreFields {
  const {
    myTeam,
    opponentTeam,
    isMyTeamHome,
    isMyTeamBatting,
    legacyCurrentBatterIndex,
  } = getLegacyTeams(state);

  return {
    myTeam,
    opponentName: opponentTeam.name,
    isMyTeamHome,
    isMyTeamBatting,
    legacyCurrentBatterIndex,
    showBatterTransition: false,
    nextBatterName: "",
  };
}

function withLegacyState<
  T extends Partial<GameState> &
    Partial<LegacyStoreFields> &
    Partial<ThemeStoreFields>,
>(state: GameState, updates: T): T & ReturnType<typeof createLegacyState> {
  return {
    ...updates,
    ...createLegacyState({
      ...state,
      ...updates,
    }),
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createEmptyGameState(),
      ...createLegacyState(createEmptyGameState()),
      primaryColor: "#EFBF04",
      secondaryColor: "#101720",

      setTeamName: (team, name) =>
        set((state) =>
          withLegacyState(state, {
            [team === "away" ? "awayTeam" : "homeTeam"]: {
              ...state[team === "away" ? "awayTeam" : "homeTeam"],
              name,
            },
          } as Partial<GameState>),
        ),

      setHomeTeam: (team) =>
        set((state) =>
          withLegacyState(state, {
            awayTeam: { ...state.awayTeam, isHome: false },
            homeTeam: { ...state.homeTeam, isHome: team === "home" },
          }),
        ),

      setTotalInnings: (innings) =>
        set((state) => withLegacyState(state, { totalInnings: innings })),

      setPlayers: (team, players) =>
        set((state) =>
          withLegacyState(state, {
            [team === "away" ? "awayTeam" : "homeTeam"]: {
              ...state[team === "away" ? "awayTeam" : "homeTeam"],
              players,
            },
          } as Partial<GameState>),
        ),

      updatePlayerPosition: (team, playerId, position) =>
        set((state) => {
          const teamKey = team === "away" ? "awayTeam" : "homeTeam";
          const currentTeam = state[teamKey];

          return withLegacyState(state, {
            [teamKey]: {
              ...currentTeam,
              players: currentTeam.players.map((player) =>
                player.id === playerId ? { ...player, position } : player,
              ),
            },
          } as Partial<GameState>);
        }),

      startGame: () =>
        set((state) => {
          const homePitcher = state.homeTeam.players.find(
            (p) => p.position === "P",
          );
          const awayPitcher = state.awayTeam.players.find(
            (p) => p.position === "P",
          );
          const myTeamIsHome = state.homeTeam.isHome;
          return withLegacyState(state, {
            status: myTeamIsHome ? "awaiting-opponent-runs" : "in-progress",
            currentPitcherId: {
              away: awayPitcher?.id || "",
              home: homePitcher?.id || "",
            },
            inningScores: Array.from(
              { length: state.totalInnings },
              (_, i) => ({
                inning: i + 1,
                away: 0,
                home: 0,
              }),
            ),
          });
        }),

      setMode: (mode) => set((state) => withLegacyState(state, { mode })),

      setThemeColors: (primaryColor, secondaryColor) =>
        set((state) =>
          withLegacyState(state, {
            primaryColor,
            secondaryColor,
          }),
        ),

      resetThemeColors: () =>
        set((state) =>
          withLegacyState(state, {
            primaryColor: "#EFBF04",
            secondaryColor: "#101720",
          }),
        ),

      endMyTeamBatting: () => get().endHalfInning(),

      dismissBatterTransition: () =>
        set((state) =>
          withLegacyState(state, {
            showBatterTransition: false,
            nextBatterName: "",
          }),
        ),

      recordOpponentRuns: (runs) =>
        set((state) => {
          const opponentTeamKey = state.homeTeam.isHome ? "away" : "home";
          const myTeamIsHome = state.homeTeam.isHome;
          const nextInning = myTeamIsHome
            ? state.currentInning
            : state.currentInning + 1;
          const myTeamKey = state.homeTeam.isHome ? "home" : "away";
          const inningIndex = state.currentInning - 1;
          const updatedScores = [...state.inningScores];

          if (updatedScores[inningIndex]) {
            updatedScores[inningIndex] = {
              ...updatedScores[inningIndex],
              [opponentTeamKey]:
                updatedScores[inningIndex][opponentTeamKey] + runs,
            };
          }

          const play = createPlay(state, "opponent-runs", {
            opponentRuns: runs,
            scoreAfter: {
              away: updatedScores.reduce((sum, inning) => sum + inning.away, 0),
              home: updatedScores.reduce((sum, inning) => sum + inning.home, 0),
            },
          });

          const myScore = play.scoreAfter[myTeamKey];
          const opponentScore = play.scoreAfter[opponentTeamKey];
          const reachedScheduledEnd =
            !myTeamIsHome && state.currentInning >= state.totalInnings;
          const isTied = myScore === opponentScore;
          const isGameOver = reachedScheduledEnd && !isTied;
          const nextTotalInnings =
            reachedScheduledEnd && isTied
              ? state.totalInnings + 1
              : state.totalInnings;

          return withLegacyState(state, {
            currentInning: isGameOver ? state.currentInning : nextInning,
            totalInnings: nextTotalInnings,
            isTopInning: myTeamIsHome ? false : true,
            status: isGameOver ? "finished" : "in-progress",
            balls: 0,
            strikes: 0,
            outs: 0,
            runners: [],
            inningScores: updatedScores,
            plays: [...state.plays, play],
            showBatterTransition: false,
            nextBatterName: "",
          });
        }),

      recordBall: () =>
        set((state) => {
          const newBalls = state.balls + 1;
          if (newBalls >= 4) {
            // Walk - handled by recordWalk
            return state;
          }
          const play = createPlay(state, "ball");
          return withLegacyState(state, {
            balls: newBalls,
            plays: [...state.plays, play],
          });
        }),

      recordStrike: () =>
        set((state) => {
          const newStrikes = state.strikes + 1;
          if (newStrikes >= 3) {
            // Strikeout - handled by recordOut
            return state;
          }
          const play = createPlay(state, "strike");
          return withLegacyState(state, {
            strikes: newStrikes,
            plays: [...state.plays, play],
          });
        }),

      recordFoul: () =>
        set((state) => {
          // Foul only adds strike if less than 2
          const newStrikes =
            state.strikes < 2 ? state.strikes + 1 : state.strikes;
          const play = createPlay(state, "foul");
          return withLegacyState(state, {
            strikes: newStrikes,
            plays: [...state.plays, play],
          });
        }),

      recordOut: (outType, fieldingPositions) =>
        set((state) => {
          const batter = get().getCurrentBatter();
          const isDoublePlay = outType === "double-play";
          const isFieldersChoice = outType === "fielders-choice";
          const outsAdded = isDoublePlay ? 2 : 1;
          const newOuts = state.outs + outsAdded;
          const play = createPlay(state, "out", { outType, fieldingPositions });

          if (isFieldersChoice) {
            const runnerOut =
              state.runners.find((runner) => runner.base === "first") ||
              state.runners[0];
            const newRunners = runnerOut
              ? state.runners.filter(
                  (runner) => runner.playerId !== runnerOut.playerId,
                )
              : [...state.runners];

            if (batter) {
              newRunners.push({ playerId: batter.id, base: "first" });
            }

            const baseState = {
              outs: newOuts,
              balls: 0,
              strikes: 0,
              runners: newRunners,
              plays: [...state.plays, play],
            };

            if (newOuts >= 3) {
              return withLegacyState(
                state,
                handleInningChange(state, baseState),
              );
            }

            const battingTeam = state.isTopInning ? "away" : "home";
            const teamPlayers = state.isTopInning
              ? state.awayTeam.players
              : state.homeTeam.players;
            const nextIndex =
              (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;

            const nextBatter = teamPlayers[nextIndex];

            return withLegacyState(state, {
              ...baseState,
              currentBatterIndex: {
                ...state.currentBatterIndex,
                [battingTeam]: nextIndex,
              },
              showBatterTransition: !!nextBatter,
              nextBatterName: nextBatter?.name || "",
            });
          }

          const baseState = {
            outs: newOuts,
            balls: 0,
            strikes: 0,
            plays: [...state.plays, play],
          };

          if (newOuts >= 3) {
            return withLegacyState(state, handleInningChange(state, baseState));
          }

          // Advance to next batter
          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            ...baseState,
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      recordHit: (hitType) =>
        set((state) => {
          const play = createPlay(state, hitType as PlayResult, { hitType });
          const batter = get().getCurrentBatter();

          let newRunners = [...state.runners];
          let runsScored = 0;

          // Advance runners based on hit type
          if (hitType === "home-run") {
            runsScored = newRunners.length + 1; // All runners plus batter
            newRunners = [];
          } else {
            // Move runners
            const advances =
              hitType === "single" ? 1 : hitType === "double" ? 2 : 3;
            newRunners = advanceRunners(newRunners, advances, (runs) => {
              runsScored += runs;
            });

            // Place batter on appropriate base
            if (batter) {
              const newBase: Base =
                hitType === "single"
                  ? "first"
                  : hitType === "double"
                    ? "second"
                    : "third";
              newRunners.push({ playerId: batter.id, base: newBase });
            }
          }

          // Update inning score
          const inningScores = [...state.inningScores];
          const inningIndex = state.currentInning - 1;
          if (inningScores[inningIndex]) {
            const scoreKey = state.isTopInning ? "away" : "home";
            inningScores[inningIndex] = {
              ...inningScores[inningIndex],
              [scoreKey]: inningScores[inningIndex][scoreKey] + runsScored,
            };
          }
          const scoreAfter = getScoreAfterFromInnings(inningScores);

          // Advance to next batter
          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            balls: 0,
            strikes: 0,
            runners: newRunners,
            inningScores,
            plays: [
              ...state.plays,
              { ...play, rbiCount: runsScored, scoreAfter },
            ],
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      recordWalk: () =>
        set((state) => {
          const play = createPlay(state, "walk");
          const batter = get().getCurrentBatter();

          let newRunners = [...state.runners];
          let runsScored = 0;

          // Force runners if bases are loaded
          if (batter) {
            newRunners = forceAdvanceRunners(newRunners, (runs) => {
              runsScored += runs;
            });
            newRunners.push({ playerId: batter.id, base: "first" });
          }

          // Update inning score
          const inningScores = [...state.inningScores];
          const inningIndex = state.currentInning - 1;
          if (inningScores[inningIndex] && runsScored > 0) {
            const scoreKey = state.isTopInning ? "away" : "home";
            inningScores[inningIndex] = {
              ...inningScores[inningIndex],
              [scoreKey]: inningScores[inningIndex][scoreKey] + runsScored,
            };
          }
          const scoreAfter = getScoreAfterFromInnings(inningScores);

          // Advance to next batter
          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            balls: 0,
            strikes: 0,
            runners: newRunners,
            inningScores,
            plays: [
              ...state.plays,
              { ...play, rbiCount: runsScored, scoreAfter },
            ],
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      recordHitByPitch: () =>
        set((state) => {
          const play = createPlay(state, "hit-by-pitch");
          const batter = get().getCurrentBatter();

          let newRunners = [...state.runners];
          let runsScored = 0;

          if (batter) {
            newRunners = forceAdvanceRunners(newRunners, (runs) => {
              runsScored += runs;
            });
            newRunners.push({ playerId: batter.id, base: "first" });
          }

          // Update inning score
          const inningScores = [...state.inningScores];
          const inningIndex = state.currentInning - 1;
          if (inningScores[inningIndex] && runsScored > 0) {
            const scoreKey = state.isTopInning ? "away" : "home";
            inningScores[inningIndex] = {
              ...inningScores[inningIndex],
              [scoreKey]: inningScores[inningIndex][scoreKey] + runsScored,
            };
          }
          const scoreAfter = getScoreAfterFromInnings(inningScores);

          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            balls: 0,
            strikes: 0,
            runners: newRunners,
            inningScores,
            plays: [
              ...state.plays,
              { ...play, rbiCount: runsScored, scoreAfter },
            ],
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      recordError: (position) =>
        set((state) => {
          const play = createPlay(state, "error", { errorPosition: position });
          const batter = get().getCurrentBatter();

          const newRunners = [...state.runners];

          // Batter reaches first on error
          if (batter) {
            newRunners.push({ playerId: batter.id, base: "first" });
          }

          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            balls: 0,
            strikes: 0,
            runners: newRunners,
            plays: [...state.plays, play],
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      recordStolenBase: (runner, toBase, isSafe = true) => {
        if (!isSafe) {
          get().recordCaughtStealing(runner);
          return;
        }

        set((state) => {
          const baseOccupied = state.runners.some(
            (currentRunner) =>
              currentRunner.playerId !== runner.playerId &&
              currentRunner.base === toBase,
          );

          if (baseOccupied) {
            return state;
          }

          const play = createPlay(state, "stolen-base", {
            runnerMovements: [
              { playerId: runner.playerId, from: runner.base, to: toBase },
            ],
          });

          const newRunners = state.runners.map((r) =>
            r.playerId === runner.playerId ? { ...r, base: toBase } : r,
          );

          return withLegacyState(state, {
            runners: newRunners,
            plays: [...state.plays, play],
          });
        });
      },

      recordCaughtStealing: (runner) =>
        set((state) => {
          const newOuts = state.outs + 1;
          const play = createPlay(state, "caught-stealing", {
            runnerMovements: [
              { playerId: runner.playerId, from: runner.base, to: "out" },
            ],
          });

          const newRunners = state.runners.filter(
            (r) => r.playerId !== runner.playerId,
          );

          const baseState = {
            outs: newOuts,
            runners: newRunners,
            plays: [...state.plays, play],
          };

          if (newOuts >= 3) {
            return withLegacyState(state, handleInningChange(state, baseState));
          }

          return withLegacyState(state, baseState);
        }),

      recordRunScores: (runnerId, isEarned = true) =>
        set((state) => {
          const runner = state.runners.find((r) => r.playerId === runnerId);
          if (!runner) return state;

          const play = createPlay(state, "run-scores", {
            runnerMovements: [
              { playerId: runnerId, from: runner.base, to: "scored" },
            ],
            isEarnedRun: isEarned,
          });

          const newRunners = state.runners.filter(
            (r) => r.playerId !== runnerId,
          );

          // Update inning score
          const inningScores = [...state.inningScores];
          const inningIndex = state.currentInning - 1;
          if (inningScores[inningIndex]) {
            const scoreKey = state.isTopInning ? "away" : "home";
            inningScores[inningIndex] = {
              ...inningScores[inningIndex],
              [scoreKey]: inningScores[inningIndex][scoreKey] + 1,
            };
          }
          const scoreAfter = getScoreAfterFromInnings(inningScores);

          return withLegacyState(state, {
            runners: newRunners,
            inningScores,
            plays: [...state.plays, { ...play, scoreAfter }],
          });
        }),

      recordRunnerOut: (runnerId) =>
        set((state) => {
          const runner = state.runners.find((r) => r.playerId === runnerId);
          if (!runner) return state;

          const newOuts = state.outs + 1;
          const play = createPlay(state, "runner-out", {
            runnerMovements: [
              { playerId: runnerId, from: runner.base, to: "out" },
            ],
          });

          const newRunners = state.runners.filter(
            (r) => r.playerId !== runnerId,
          );

          const baseState = {
            outs: newOuts,
            runners: newRunners,
            plays: [...state.plays, play],
          };

          if (newOuts >= 3) {
            return withLegacyState(state, handleInningChange(state, baseState));
          }

          return withLegacyState(state, baseState);
        }),

      advanceRunner: (runnerId, toBase) =>
        set((state) => {
          if (toBase === "home") {
            // Runner scores
            return get().recordRunScores(runnerId) as unknown as GameState;
          }

          const newRunners = state.runners.map((r) =>
            r.playerId === runnerId ? { ...r, base: toBase as Base } : r,
          );

          return withLegacyState(state, { runners: newRunners });
        }),

      nextBatter: () =>
        set((state) => {
          const battingTeam = state.isTopInning ? "away" : "home";
          const teamPlayers = state.isTopInning
            ? state.awayTeam.players
            : state.homeTeam.players;
          const nextIndex =
            (state.currentBatterIndex[battingTeam] + 1) % teamPlayers.length;
          const nextBatter = teamPlayers[nextIndex];

          return withLegacyState(state, {
            balls: 0,
            strikes: 0,
            currentBatterIndex: {
              ...state.currentBatterIndex,
              [battingTeam]: nextIndex,
            },
            showBatterTransition: !!nextBatter,
            nextBatterName: nextBatter?.name || "",
          });
        }),

      endHalfInning: () =>
        set((state) =>
          withLegacyState(state, {
            status: "awaiting-opponent-runs",
            balls: 0,
            strikes: 0,
            outs: 0,
            runners: [],
            showBatterTransition: false,
            nextBatterName: "",
          }),
        ),

      undoLastPlay: () =>
        set((state) => {
          if (state.plays.length === 0) return state;

          const plays = [...state.plays];
          const lastPlay = plays.pop()!;

          // This is a simplified undo - in a full implementation,
          // you'd need to restore the exact game state
          return withLegacyState(state, {
            plays,
            balls: lastPlay.balls,
            strikes: lastPlay.strikes,
            outs: lastPlay.outs,
          });
        }),

      recordAdvancedPlay: (playData) =>
        set((state) => {
          const play = {
            ...createPlay(state, playData.result || "out"),
            ...playData,
          };
          return withLegacyState(state, {
            plays: [...state.plays, play],
          });
        }),

      resetGame: () =>
        set((state) => ({
          ...createEmptyGameState(),
          ...createLegacyState(createEmptyGameState()),
          primaryColor: state.primaryColor,
          secondaryColor: state.secondaryColor,
        })),

      exportJSON: () => {
        const state = get();
        return JSON.stringify(state, null, 2);
      },

      loadGameSnapshot: (snapshot) =>
        set((state) => {
          const restoredGame: GameState = {
            ...createEmptyGameState(),
            ...snapshot,
          };

          return {
            ...state,
            ...restoredGame,
            ...createLegacyState(restoredGame),
            primaryColor: snapshot.primaryColor ?? state.primaryColor,
            secondaryColor: snapshot.secondaryColor ?? state.secondaryColor,
          };
        }),

      getCurrentBatter: () => {
        const state = get();
        const battingTeam = state.isTopInning ? "away" : "home";
        const team = state.isTopInning ? state.awayTeam : state.homeTeam;
        const index = state.currentBatterIndex[battingTeam];
        return team.players[index] || null;
      },

      getCurrentPitcher: () => {
        const state = get();
        const fieldingTeam = state.isTopInning ? "home" : "away";
        const team = state.isTopInning ? state.homeTeam : state.awayTeam;
        const pitcherId = state.currentPitcherId[fieldingTeam];
        return team.players.find((p) => p.id === pitcherId) || null;
      },

      getBattingTeam: () => {
        const state = get();
        return state.isTopInning ? "away" : "home";
      },

      getFieldingTeam: () => {
        const state = get();
        return state.isTopInning ? "home" : "away";
      },

      getTotalScore: (team) => {
        const state = get();
        return state.inningScores.reduce(
          (sum, inning) => sum + inning[team],
          0,
        );
      },

      getTotalHits: (team) => {
        const state = get();
        const teamData = team === "away" ? state.awayTeam : state.homeTeam;
        const playerIds = new Set(teamData.players.map((p) => p.id));

        return state.plays.filter(
          (p) =>
            playerIds.has(p.batterId) &&
            ["single", "double", "triple", "home-run"].includes(p.result),
        ).length;
      },

      getTotalErrors: (team) => {
        const state = get();
        // Errors are recorded against the fielding team
        const opposingTeam = team === "away" ? "home" : "away";
        const teamData =
          opposingTeam === "away" ? state.awayTeam : state.homeTeam;
        const playerIds = new Set(teamData.players.map((p) => p.id));

        return state.plays.filter(
          (p) => playerIds.has(p.batterId) && p.result === "error",
        ).length;
      },

      getBatterStats: (playerId) => {
        const state = get();
        const playerPlays = state.plays.filter((p) => p.batterId === playerId);

        const stats: BatterStats = {
          pa: 0,
          ab: 0,
          runs: 0,
          hits: 0,
          rbi: 0,
          walks: 0,
          strikeouts: 0,
        };

        playerPlays.forEach((play) => {
          if (
            [
              "single",
              "double",
              "triple",
              "home-run",
              "out",
              "walk",
              "hit-by-pitch",
              "error",
            ].includes(play.result)
          ) {
            stats.pa++;

            if (!["walk", "hit-by-pitch"].includes(play.result)) {
              stats.ab++;
            }

            if (
              ["single", "double", "triple", "home-run"].includes(play.result)
            ) {
              stats.hits++;
            }

            if (play.result === "walk") {
              stats.walks++;
            }

            if (play.outType?.includes("strikeout")) {
              stats.strikeouts++;
            }

            stats.rbi += play.rbiCount || 0;
          }
        });

        // Count runs scored
        state.plays.forEach((play) => {
          if (play.result === "home-run" && play.batterId === playerId) {
            stats.runs++;
          }

          play.runnerMovements?.forEach((movement) => {
            if (movement.playerId === playerId && movement.to === "scored") {
              stats.runs++;
            }
          });
        });

        return stats;
      },

      getPitcherStats: (playerId) => {
        const state = get();
        const pitcherPlays = state.plays.filter(
          (p) => p.pitcherId === playerId,
        );

        const stats: PitcherStats = {
          inningsPitched: 0,
          runs: 0,
          earnedRuns: 0,
          hits: 0,
          walks: 0,
          strikeouts: 0,
        };

        // Calculate outs recorded
        let outsRecorded = 0;

        pitcherPlays.forEach((play) => {
          if (play.result === "out") {
            outsRecorded += play.outType === "double-play" ? 2 : 1;
          }

          if (
            ["single", "double", "triple", "home-run"].includes(play.result)
          ) {
            stats.hits++;
          }

          if (play.result === "walk") {
            stats.walks++;
          }

          if (play.outType?.includes("strikeout")) {
            stats.strikeouts++;
          }

          // Count runs
          play.runnerMovements?.forEach((movement) => {
            if (movement.to === "scored") {
              stats.runs++;
              if (play.isEarnedRun) {
                stats.earnedRuns++;
              }
            }
          });
        });

        // Convert outs to innings pitched
        stats.inningsPitched =
          Math.floor(outsRecorded / 3) + (outsRecorded % 3) / 10;

        return stats;
      },
    }),
    {
      name: "dugout-scorekeeper-game",
    },
  ),
);

// Helper functions
function createPlay(
  state: GameState,
  result: PlayResult,
  extras?: Partial<Play>,
): Play {
  const batter = state.isTopInning
    ? state.awayTeam.players[state.currentBatterIndex.away]
    : state.homeTeam.players[state.currentBatterIndex.home];

  const pitcher = state.isTopInning
    ? state.homeTeam.players.find((p) => p.id === state.currentPitcherId.home)
    : state.awayTeam.players.find((p) => p.id === state.currentPitcherId.away);

  return {
    id: generateId(),
    inning: state.currentInning,
    isTopInning: state.isTopInning,
    batterId: batter?.id || "",
    pitcherId: pitcher?.id || "",
    result,
    balls: state.balls,
    strikes: state.strikes,
    outs: state.outs,
    timestamp: Date.now(),
    scoreAfter: {
      away: state.inningScores.reduce((sum, i) => sum + i.away, 0),
      home: state.inningScores.reduce((sum, i) => sum + i.home, 0),
    },
    ...extras,
  };
}

function advanceRunners(
  runners: Runner[],
  bases: number,
  onScore: (runs: number) => void,
): Runner[] {
  const baseOrder: (Base | "home")[] = ["first", "second", "third", "home"];
  let runsScored = 0;

  const newRunners = runners
    .map((runner) => {
      const currentIndex = baseOrder.indexOf(runner.base);
      const newIndex = currentIndex + bases;

      if (newIndex >= 3) {
        runsScored++;
        return null;
      }

      return { ...runner, base: baseOrder[newIndex] as Base };
    })
    .filter((r): r is Runner => r !== null);

  onScore(runsScored);
  return newRunners;
}

function getScoreAfterFromInnings(inningScores: GameState["inningScores"]) {
  return {
    away: inningScores.reduce((sum, inning) => sum + inning.away, 0),
    home: inningScores.reduce((sum, inning) => sum + inning.home, 0),
  };
}

function forceAdvanceRunners(
  runners: Runner[],
  onScore: (runs: number) => void,
): Runner[] {
  // Check if first base is occupied
  const firstRunner = runners.find((r) => r.base === "first");
  if (!firstRunner) return runners;

  // Force advance chain
  const secondRunner = runners.find((r) => r.base === "second");
  const thirdRunner = runners.find((r) => r.base === "third");

  let runsScored = 0;
  const newRunners: Runner[] = [];

  // Move runners
  runners.forEach((runner) => {
    if (runner.base === "third") {
      // Scores if forced
      if (firstRunner && secondRunner && thirdRunner) {
        runsScored++;
      } else {
        newRunners.push(runner);
      }
    } else if (runner.base === "second") {
      if (firstRunner && secondRunner) {
        newRunners.push({ ...runner, base: "third" });
      } else {
        newRunners.push(runner);
      }
    } else if (runner.base === "first") {
      newRunners.push({ ...runner, base: "second" });
    }
  });

  onScore(runsScored);
  return newRunners;
}

function handleInningChange(
  state: GameState,
  updates: Partial<GameState>,
): Partial<GameState> & Partial<LegacyStoreFields> {
  const myTeamIsHome = state.homeTeam.isHome;
  const myTeamBattingNow = state.isTopInning ? !myTeamIsHome : myTeamIsHome;

  if (myTeamBattingNow) {
    const myTeamKey = myTeamIsHome ? "home" : "away";
    const opponentTeamKey = myTeamIsHome ? "away" : "home";
    const myScore = state.inningScores.reduce((sum, inning) => {
      return sum + inning[myTeamKey];
    }, 0);
    const opponentScore = state.inningScores.reduce((sum, inning) => {
      return sum + inning[opponentTeamKey];
    }, 0);
    const reachedScheduledEnd =
      myTeamIsHome && state.currentInning >= state.totalInnings;
    const isTied = myScore === opponentScore;
    const isGameOver = reachedScheduledEnd && !isTied;
    const nextTotalInnings =
      reachedScheduledEnd && isTied
        ? state.totalInnings + 1
        : state.totalInnings;

    const nextOpponentInning = myTeamIsHome
      ? state.currentInning + 1
      : state.currentInning;

    return {
      ...updates,
      totalInnings: nextTotalInnings,
      currentInning: isGameOver ? state.currentInning : nextOpponentInning,
      isTopInning: myTeamIsHome,
      outs: 0,
      balls: 0,
      strikes: 0,
      runners: [],
      status: isGameOver ? "finished" : "awaiting-opponent-runs",
      showBatterTransition: false,
      nextBatterName: "",
    };
  }

  if (state.isTopInning) {
    return {
      ...updates,
      isTopInning: false,
      outs: 0,
      balls: 0,
      strikes: 0,
      runners: [],
      showBatterTransition: false,
      nextBatterName: "",
    };
  } else {
    // Switch to top of next inning
    const nextInning = state.currentInning + 1;
    const isGameOver = nextInning > state.totalInnings;

    return {
      ...updates,
      currentInning: isGameOver ? state.currentInning : nextInning,
      isTopInning: true,
      outs: 0,
      balls: 0,
      strikes: 0,
      runners: [],
      status: isGameOver ? "finished" : "in-progress",
      showBatterTransition: false,
      nextBatterName: "",
    };
  }
}
