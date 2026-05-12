import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

type LiveGamePayload = {
  game?: Record<string, unknown>;
  clientId?: string;
  action?: "claim" | "release" | "update" | "clear";
};

const LOCK_TTL_MS = 30_000;

type LiveGameRow = {
  game?: string | null;
  updatedAt?: number;
  lockOwner?: string | null;
  lockExpiresAt?: number;
};

function getLiveRow() {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        game_json as game,
        updated_at as updatedAt,
        lock_owner as lockOwner,
        lock_expires_at as lockExpiresAt
      FROM live_game
      WHERE singleton_id = 1
      LIMIT 1
      `,
    )
    .get() as LiveGameRow | undefined;

  if (!row) {
    db.prepare(
      `
      INSERT INTO live_game (
        singleton_id,
        game_json,
        updated_at,
        lock_owner,
        lock_expires_at
      ) VALUES (1, NULL, 0, NULL, 0)
      `,
    ).run();

    return {
      game: null,
      updatedAt: 0,
      lockOwner: null,
      lockExpiresAt: 0,
    } as const;
  }

  return {
    game: row.game ?? null,
    updatedAt: row.updatedAt ?? 0,
    lockOwner: row.lockOwner ?? null,
    lockExpiresAt: row.lockExpiresAt ?? 0,
  };
}

function hasActiveLock(lockExpiresAt: number) {
  return lockExpiresAt > Date.now();
}

export async function GET(request: Request) {
  try {
    const row = getLiveRow();
    const clientId = new URL(request.url).searchParams.get("clientId") || "";
    const lockActive = hasActiveLock(row.lockExpiresAt);
    const canEdit = !lockActive || !row.lockOwner || row.lockOwner === clientId;

    return NextResponse.json({
      game: row.game ? JSON.parse(row.game) : null,
      updatedAt: row.updatedAt,
      lock: {
        active: lockActive,
        owner: lockActive ? row.lockOwner : null,
        expiresAt: row.lockExpiresAt,
      },
      canEdit,
    });
  } catch (err) {
    console.error("Live game GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch live game" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiveGamePayload;
    const clientId = body.clientId?.trim();
    const action = body.action || "update";

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const row = getLiveRow();
    const now = Date.now();
    const lockActive = hasActiveLock(row.lockExpiresAt);
    const lockedByOther =
      lockActive && !!row.lockOwner && row.lockOwner !== clientId;

    if (action === "claim") {
      if (lockedByOther) {
        return NextResponse.json(
          {
            ok: false,
            canEdit: false,
            lock: {
              active: true,
              owner: row.lockOwner,
              expiresAt: row.lockExpiresAt,
            },
          },
          { status: 409 },
        );
      }

      const lockExpiresAt = now + LOCK_TTL_MS;
      db.prepare(
        `
      UPDATE live_game
      SET lock_owner = ?, lock_expires_at = ?
      WHERE singleton_id = 1
      `,
      ).run(clientId, lockExpiresAt);

      return NextResponse.json({
        ok: true,
        canEdit: true,
        lock: {
          active: true,
          owner: clientId,
          expiresAt: lockExpiresAt,
        },
      });
    }

    if (action === "release") {
      if (!row.lockOwner || row.lockOwner === clientId || !lockActive) {
        db.prepare(
          `
        UPDATE live_game
        SET lock_owner = NULL, lock_expires_at = 0
        WHERE singleton_id = 1
        `,
        ).run();
      }

      return NextResponse.json({ ok: true, canEdit: true });
    }

    if (action === "clear") {
      if (lockedByOther) {
        return NextResponse.json(
          {
            error: "Live game is locked by another user",
            canEdit: false,
          },
          { status: 409 },
        );
      }

      db.prepare(
        `
      UPDATE live_game
      SET game_json = NULL,
          updated_at = ?,
          lock_owner = NULL,
          lock_expires_at = 0
      WHERE singleton_id = 1
      `,
      ).run(now);

      return NextResponse.json({ ok: true, canEdit: true, cleared: true });
    }

    if (lockedByOther) {
      return NextResponse.json(
        {
          error: "Live game is locked by another user",
          canEdit: false,
          lock: {
            active: true,
            owner: row.lockOwner,
            expiresAt: row.lockExpiresAt,
          },
        },
        { status: 409 },
      );
    }

    if (!body.game) {
      return NextResponse.json({ error: "game is required" }, { status: 400 });
    }

    const lockExpiresAt = now + LOCK_TTL_MS;
    db.prepare(
      `
    UPDATE live_game
    SET game_json = ?,
        updated_at = ?,
        lock_owner = ?,
        lock_expires_at = ?
    WHERE singleton_id = 1
    `,
    ).run(JSON.stringify(body.game), now, clientId, lockExpiresAt);

    return NextResponse.json({
      ok: true,
      canEdit: true,
      updatedAt: now,
      lock: {
        active: true,
        owner: clientId,
        expiresAt: lockExpiresAt,
      },
    });
  } catch (err) {
    console.error("Live game POST error:", err);
    return NextResponse.json(
      { error: "Failed to process live game request" },
      { status: 500 },
    );
  }
}
