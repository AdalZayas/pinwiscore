import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";
import { upsertRostersFromGame } from "@/lib/roster-db";

type SavedGame = {
  id: string;
  homeTeam: { name: string; isHome: boolean };
  awayTeam: { name: string; isHome: boolean };
  inningScores: Array<{ away: number; home: number }>;
};

function getScores(game: SavedGame) {
  const myTeamIsHome = game.homeTeam.isHome;
  const myScore = game.inningScores.reduce((sum, inning) => {
    return sum + (myTeamIsHome ? inning.home : inning.away);
  }, 0);
  const opponentScore = game.inningScores.reduce((sum, inning) => {
    return sum + (myTeamIsHome ? inning.away : inning.home);
  }, 0);

  return {
    myScore,
    opponentScore,
    myTeamName: myTeamIsHome ? game.homeTeam.name : game.awayTeam.name,
    opponentName: myTeamIsHome ? game.awayTeam.name : game.homeTeam.name,
  };
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        game_id as id,
        saved_at as savedAt,
        my_team_name as myTeamName,
        opponent_name as opponentName,
        my_score as myScore,
        opponent_score as opponentScore
      FROM games
      ORDER BY saved_at DESC
      LIMIT 200
      `,
    )
    .all();

  return NextResponse.json({ games: rows });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    game?: SavedGame & Record<string, unknown>;
  };

  if (!body.game?.id || !body.game.homeTeam || !body.game.awayTeam) {
    return NextResponse.json(
      { error: "Invalid game payload" },
      { status: 400 },
    );
  }

  const game = body.game;
  const scoreInfo = getScores(game);
  const savedAt = Date.now();

  const db = getDb();
  db.prepare(
    `
      INSERT INTO games (
        game_id,
        saved_at,
        my_team_name,
        opponent_name,
        my_score,
        opponent_score,
        game_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(game_id) DO UPDATE SET
        saved_at = excluded.saved_at,
        my_team_name = excluded.my_team_name,
        opponent_name = excluded.opponent_name,
        my_score = excluded.my_score,
        opponent_score = excluded.opponent_score,
        game_json = excluded.game_json
    `,
  ).run(
    game.id,
    savedAt,
    scoreInfo.myTeamName || "My Team",
    scoreInfo.opponentName || "Opponent",
    scoreInfo.myScore,
    scoreInfo.opponentScore,
    JSON.stringify(game),
  );

  upsertRostersFromGame(game);

  return NextResponse.json({ ok: true, id: game.id });
}
