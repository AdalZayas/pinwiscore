import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = getDb();

  const row = db
    .prepare(
      `
      SELECT game_json as game
      FROM games
      WHERE game_id = ?
      LIMIT 1
      `,
    )
    .get(id) as { game?: string } | undefined;

  if (!row?.game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ game: JSON.parse(row.game) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = getDb();

  const result = db
    .prepare(
      `
      DELETE FROM games
      WHERE game_id = ?
      `,
    )
    .run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}
