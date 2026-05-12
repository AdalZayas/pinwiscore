import { NextResponse } from "next/server";
import {
  getPlayersForTeam,
  upsertPlayersForTeam,
  deletePlayerFromTeam,
  deleteAllPlayersForTeam,
} from "@/lib/roster-db";
import type { Player } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamName = url.searchParams.get("teamName") || "";

  if (!teamName.trim()) {
    return NextResponse.json({ players: [] });
  }

  return NextResponse.json({ players: getPlayersForTeam(teamName) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    teamName?: string;
    player?: Player;
    players?: Player[];
  };

  const teamName = body.teamName?.trim();
  const players = body.players ?? (body.player ? [body.player] : []);

  if (!teamName || players.length === 0) {
    return NextResponse.json(
      { error: "Invalid roster payload" },
      { status: 400 },
    );
  }

  upsertPlayersForTeam(teamName, players);

  return NextResponse.json({ ok: true, count: players.length });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as {
    teamName?: string;
    playerName?: string;
    deleteAll?: boolean;
  };

  const teamName = body.teamName?.trim();

  if (!teamName) {
    return NextResponse.json(
      { error: "Team name is required" },
      { status: 400 },
    );
  }

  if (body.deleteAll) {
    deleteAllPlayersForTeam(teamName);
    return NextResponse.json({ ok: true, message: "All players deleted" });
  }

  if (!body.playerName?.trim()) {
    return NextResponse.json(
      { error: "Player name is required for single delete" },
      { status: 400 },
    );
  }

  deletePlayerFromTeam(teamName, body.playerName);

  return NextResponse.json({ ok: true, message: "Player deleted" });
}
