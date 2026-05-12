import "server-only";

import { getDb } from "@/lib/sqlite";
import type { Player, PositionAbbrev } from "@/lib/types";

function normalizeTeamName(teamName: string) {
  return teamName.trim().toLowerCase();
}

function makePlayerKey(teamName: string, player: Player) {
  return `${normalizeTeamName(teamName)}::${player.name.trim().toLowerCase()}`;
}

export function upsertPlayersForTeam(teamName: string, players: Player[]) {
  if (!teamName.trim() || players.length === 0) return;

  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO players (
      player_key,
      player_id,
      team_name,
      player_name,
      jersey_number,
      position,
      batting_order,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_key) DO UPDATE SET
      player_id = excluded.player_id,
      team_name = excluded.team_name,
      player_name = excluded.player_name,
      jersey_number = excluded.jersey_number,
      position = excluded.position,
      batting_order = excluded.batting_order,
      updated_at = excluded.updated_at
  `);

  for (const player of players) {
    stmt.run(
      makePlayerKey(teamName, player),
      player.id,
      teamName.trim(),
      player.name.trim(),
      player.jerseyNumber || "0",
      player.position || "CF",
      player.battingOrder || 0,
      now,
    );
  }
}

export function getPlayersForTeam(teamName: string): Player[] {
  if (!teamName.trim()) return [];

  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        player_id as id,
        player_name as name,
        jersey_number as jersey_number,
        position,
        batting_order as batting_order
      FROM players
      WHERE lower(team_name) = lower(?)
      ORDER BY batting_order ASC, player_name ASC
      `,
    )
    .all(teamName.trim()) as Array<{
    id: string;
    name: string;
    jersey_number: string;
    position: string;
    batting_order: number;
  }>;

  return rows.map((row, index) => {
    const safeName = row.name.trim() || "Player";
    return {
      id: row.id || `${normalizeTeamName(teamName)}::${safeName.toLowerCase()}`,
      name: safeName,
      jerseyNumber: row.jersey_number || "0",
      position: (row.position || "CF") as PositionAbbrev,
      battingOrder: row.batting_order || index + 1,
    };
  });
}

export function upsertRostersFromGame(game: {
  homeTeam?: { name?: string; players?: Player[] };
  awayTeam?: { name?: string; players?: Player[] };
}) {
  if (game.homeTeam?.name) {
    upsertPlayersForTeam(game.homeTeam.name, game.homeTeam.players || []);
  }
  if (game.awayTeam?.name) {
    upsertPlayersForTeam(game.awayTeam.name, game.awayTeam.players || []);
  }
}

export function clearAllPlayers() {
  const db = getDb();
  db.prepare("DELETE FROM players").run();
}
