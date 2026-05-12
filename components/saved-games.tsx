"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SavedGameSummary = {
  id: string;
  savedAt: number;
  myTeamName: string;
  opponentName: string;
  myScore: number;
  opponentScore: number;
};

export function SavedGames() {
  const { loadGameSnapshot } = useGameStore();
  const [games, setGames] = useState<SavedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      try {
        setLoading(true);
        const response = await fetch("/api/games", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load saved games");
        }

        const data = (await response.json()) as { games?: SavedGameSummary[] };
        if (mounted) {
          setGames(data.games || []);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Could not load saved games");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadGames();

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenGame = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to open saved game");
      }

      const data = (await response.json()) as {
        game?: Record<string, unknown>;
      };

      if (data.game) {
        loadGameSnapshot(data.game);
      }
    } catch {
      setError("Could not open the selected game");
    }
  };

  const handleDeleteGame = async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete saved game");
      }

      setGames((currentGames) => currentGames.filter((game) => game.id !== id));
      setError(null);
    } catch {
      setError("Could not delete the selected game");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Saved Games</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading saved games...
          </p>
        )}

        {!loading && games.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            No saved games yet. Finished games will appear here.
          </p>
        )}

        {!loading &&
          games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {game.myTeamName} {game.myScore} - {game.opponentScore}{" "}
                  {game.opponentName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(game.savedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenGame(game.id)}
                >
                  Open
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete saved game?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove this saved game.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
