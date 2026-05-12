import { NextResponse } from "next/server";
import { clearAllPlayers } from "@/lib/roster-db";

export async function POST() {
  try {
    clearAllPlayers();
    return NextResponse.json({
      ok: true,
      message: "All players cleared successfully",
    });
  } catch (err) {
    console.error("Error clearing players:", err);
    return NextResponse.json(
      { error: "Failed to clear players" },
      { status: 500 },
    );
  }
}
