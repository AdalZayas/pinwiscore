import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let db: DatabaseSync | null = null;

function ensureDb() {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "games.sqlite");
  db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      game_id TEXT PRIMARY KEY,
      saved_at INTEGER NOT NULL,
      my_team_name TEXT NOT NULL,
      opponent_name TEXT NOT NULL,
      my_score INTEGER NOT NULL,
      opponent_score INTEGER NOT NULL,
      game_json TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      player_key TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      player_name TEXT NOT NULL,
      jersey_number TEXT NOT NULL,
      position TEXT NOT NULL,
      batting_order INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_players_team_name
    ON players(team_name)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS live_game (
      singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
      game_json TEXT,
      updated_at INTEGER NOT NULL,
      lock_owner TEXT,
      lock_expires_at INTEGER NOT NULL
    )
  `);

  return db;
}

export function getDb() {
  return ensureDb();
}
