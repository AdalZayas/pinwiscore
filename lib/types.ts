import { generateId } from "./utils";

// Baseball position numbers
export const POSITIONS = {
  1: "P",
  2: "C",
  3: "1B",
  4: "2B",
  5: "3B",
  6: "SS",
  7: "LF",
  8: "CF",
  9: "RF",
} as const;

export type PositionNumber = keyof typeof POSITIONS;
export type PositionAbbrev = (typeof POSITIONS)[PositionNumber];
export type PlayerPosition = PositionAbbrev | "DH";

export interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  position: PlayerPosition;
  battingOrder: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  isHome: boolean;
}

export type Base = "first" | "second" | "third";

export interface Runner {
  playerId: string;
  base: Base;
}

export type OutType =
  | "groundout"
  | "flyout"
  | "lineout"
  | "popout"
  | "strikeout-swinging"
  | "strikeout-looking"
  | "force-out"
  | "tag-out"
  | "double-play"
  | "fielders-choice"
  | "sacrifice-fly"
  | "sacrifice-bunt";

export type HitType = "single" | "double" | "triple" | "home-run";

export type PlayResult =
  | "ball"
  | "strike"
  | "foul"
  | "out"
  | "single"
  | "double"
  | "triple"
  | "home-run"
  | "walk"
  | "hit-by-pitch"
  | "error"
  | "stolen-base"
  | "caught-stealing"
  | "run-scores"
  | "opponent-runs"
  | "runner-out";

export interface RunnerMovement {
  playerId: string;
  from: Base | "home";
  to: Base | "home" | "out" | "scored";
}

export interface Play {
  id: string;
  inning: number;
  isTopInning: boolean;
  batterId: string;
  pitcherId: string;
  result: PlayResult;
  outType?: OutType;
  hitType?: HitType;
  fieldingPositions?: PositionNumber[];
  runnerMovements?: RunnerMovement[];
  rbiCount?: number;
  isEarnedRun?: boolean;
  errorPosition?: PositionNumber;
  notes?: string;
  opponentRuns?: number;
  balls: number;
  strikes: number;
  outs: number;
  timestamp: number;
  scoreAfter: {
    away: number;
    home: number;
  };
}

export interface PlateAppearance {
  inning: number;
  result: string;
  rbi?: number;
  runs?: number;
}

export interface BatterStats {
  pa: number; // plate appearances
  ab: number; // at bats
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
}

export interface PitcherStats {
  inningsPitched: number;
  runs: number;
  earnedRuns: number;
  hits: number;
  walks: number;
  strikeouts: number;
}

export interface TeamStats {
  runs: number;
  hits: number;
  errors: number;
}

export interface InningScore {
  inning: number;
  away: number;
  home: number;
}

export interface GameState {
  id: string;
  status: "setup" | "in-progress" | "awaiting-opponent-runs" | "finished";
  awayTeam: Team;
  homeTeam: Team;
  totalInnings: number;
  currentInning: number;
  isTopInning: boolean;
  currentBatterIndex: {
    away: number;
    home: number;
  };
  currentPitcherId: {
    away: string;
    home: string;
  };
  balls: number;
  strikes: number;
  outs: number;
  runners: Runner[];
  inningScores: InningScore[];
  plays: Play[];
  mode: "simple" | "advanced";
}

export const createEmptyGameState = (): GameState => ({
  id: generateId(),
  status: "setup",
  awayTeam: {
    id: generateId(),
    name: "",
    players: [],
    isHome: false,
  },
  homeTeam: {
    id: generateId(),
    name: "",
    players: [],
    isHome: true,
  },
  totalInnings: 9,
  currentInning: 1,
  isTopInning: true,
  currentBatterIndex: { away: 0, home: 0 },
  currentPitcherId: { away: "", home: "" },
  balls: 0,
  strikes: 0,
  outs: 0,
  runners: [],
  inningScores: [],
  plays: [],
  mode: "simple",
});

// Sample data for testing
export const samplePlayers: { pinwinos: Player[]; desechables: Player[] } = {
  pinwinos: [
    {
      id: "1",
      name: "Carlos Ramos",
      jerseyNumber: "7",
      position: "CF",
      battingOrder: 1,
    },
    {
      id: "2",
      name: "Miguel Torres",
      jerseyNumber: "23",
      position: "SS",
      battingOrder: 2,
    },
    {
      id: "3",
      name: "Juan Martinez",
      jerseyNumber: "14",
      position: "3B",
      battingOrder: 3,
    },
    {
      id: "4",
      name: "Roberto Silva",
      jerseyNumber: "44",
      position: "1B",
      battingOrder: 4,
    },
    {
      id: "5",
      name: "Pedro Gonzalez",
      jerseyNumber: "9",
      position: "LF",
      battingOrder: 5,
    },
    {
      id: "6",
      name: "Luis Hernandez",
      jerseyNumber: "11",
      position: "RF",
      battingOrder: 6,
    },
    {
      id: "7",
      name: "Diego Vargas",
      jerseyNumber: "4",
      position: "2B",
      battingOrder: 7,
    },
    {
      id: "8",
      name: "Fernando Lopez",
      jerseyNumber: "22",
      position: "C",
      battingOrder: 8,
    },
    {
      id: "9",
      name: "Antonio Cruz",
      jerseyNumber: "31",
      position: "P",
      battingOrder: 9,
    },
  ],
  desechables: [
    {
      id: "10",
      name: "Alex Mendez",
      jerseyNumber: "2",
      position: "CF",
      battingOrder: 1,
    },
    {
      id: "11",
      name: "David Ruiz",
      jerseyNumber: "17",
      position: "2B",
      battingOrder: 2,
    },
    {
      id: "12",
      name: "Oscar Moreno",
      jerseyNumber: "25",
      position: "1B",
      battingOrder: 3,
    },
    {
      id: "13",
      name: "Javier Sanchez",
      jerseyNumber: "8",
      position: "LF",
      battingOrder: 4,
    },
    {
      id: "14",
      name: "Ricardo Diaz",
      jerseyNumber: "33",
      position: "3B",
      battingOrder: 5,
    },
    {
      id: "15",
      name: "Eduardo Castro",
      jerseyNumber: "19",
      position: "SS",
      battingOrder: 6,
    },
    {
      id: "16",
      name: "Gabriel Reyes",
      jerseyNumber: "5",
      position: "RF",
      battingOrder: 7,
    },
    {
      id: "17",
      name: "Manuel Ortiz",
      jerseyNumber: "12",
      position: "C",
      battingOrder: 8,
    },
    {
      id: "18",
      name: "Sergio Flores",
      jerseyNumber: "41",
      position: "P",
      battingOrder: 9,
    },
  ],
};
