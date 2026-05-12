"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useGameStore } from "@/lib/game-store";
import { GameSetup } from "@/components/game-setup";
import { GameScreen } from "@/components/game-screen";
import { GameFinished } from "@/components/game-finished";
import { OpponentRunsInput } from "@/components/opponent-runs-input";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Download,
  RotateCcw,
  Printer,
  PlugZap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LIVE_POLL_MS = 2000;
const LIVE_LOCK_REFRESH_MS = 10000;

function isLiveStatus(status: string) {
  return status === "in-progress" || status === "awaiting-opponent-runs";
}

function toRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const value = parseInt(expanded, 16);
  if (Number.isNaN(value) || expanded.length !== 6) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getReadableForeground(hex: string) {
  const rgb = toRgb(hex);
  if (!rgb) return "#ffffff";

  const toLinear = (channel: number) => {
    const scaled = channel / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b);

  return luminance > 0.45 ? "#000000" : "#ffffff";
}

export default function Home() {
  const isClientReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    status,
    isMyTeamBatting,
    resetGame,
    exportJSON,
    loadGameSnapshot,
    primaryColor,
    secondaryColor,
  } = useGameStore();
  const clientIdRef = useRef("");
  const liveSyncTimerRef = useRef<number | null>(null);
  const lastRemoteUpdateRef = useRef(0);
  const [canEditLive, setCanEditLive] = useState(true);
  const { toast } = useToast();

  const shouldShowOpponentRuns =
    status === "awaiting-opponent-runs" ||
    (status === "in-progress" && !isMyTeamBatting);
  const isReadOnlyLive = isLiveStatus(status) && !canEditLive;

  const getClientId = useCallback(() => {
    if (clientIdRef.current) return clientIdRef.current;
    if (!isClientReady) return "";

    const key = "pinwiscore-client-id";
    let clientId = window.localStorage.getItem(key);

    if (!clientId) {
      clientId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(key, clientId);
    }

    clientIdRef.current = clientId;
    return clientId;
  }, [isClientReady]);

  const releaseScoringLock = useCallback(
    async (source: "manual" | "hidden" | "unload") => {
      const clientId = getClientId();
      if (!clientId) return;

      const payload = JSON.stringify({
        action: "release",
        clientId,
      });

      if (source !== "manual") {
        const sent =
          typeof navigator !== "undefined" &&
          typeof navigator.sendBeacon === "function" &&
          navigator.sendBeacon(
            "/api/live-game",
            new Blob([payload], { type: "application/json" }),
          );

        if (sent) return;
      }

      await fetch("/api/live-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: source !== "manual",
      });
    },
    [getClientId],
  );

  useEffect(() => {
    const root = document.documentElement;
    const primaryForeground = getReadableForeground(primaryColor);
    const secondaryForeground = getReadableForeground(secondaryColor);

    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--primary-foreground", primaryForeground);
    root.style.setProperty("--accent", primaryColor);
    root.style.setProperty("--accent-foreground", primaryForeground);
    root.style.setProperty("--ring", primaryColor);
    root.style.setProperty("--sidebar-primary", primaryColor);
    root.style.setProperty("--sidebar-primary-foreground", primaryForeground);

    root.style.setProperty("--secondary", secondaryColor);
    root.style.setProperty("--secondary-foreground", secondaryForeground);
    root.style.setProperty("--sidebar-accent", secondaryColor);
    root.style.setProperty("--sidebar-accent-foreground", secondaryForeground);
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;

    let isCancelled = false;

    const pollLiveGame = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
          `/api/live-game?clientId=${encodeURIComponent(clientId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        clearTimeout(timeoutId);
        if (!response.ok || isCancelled) return;

        const data = (await response.json()) as {
          game: Record<string, unknown> | null;
          updatedAt: number;
          canEdit: boolean;
        };

        setCanEditLive(Boolean(data.canEdit));

        const localState = useGameStore.getState();

        if (!data.game) {
          if (isLiveStatus(localState.status)) {
            resetGame();
          }

          lastRemoteUpdateRef.current = Math.max(
            lastRemoteUpdateRef.current,
            typeof data.updatedAt === "number" ? data.updatedAt : 0,
          );
          return;
        }

        if (
          typeof data.updatedAt === "number" &&
          data.updatedAt > lastRemoteUpdateRef.current
        ) {
          const localGameId = localState.id;
          const remoteGameId =
            typeof data.game.id === "string" ? data.game.id : "";
          const shouldHydrate =
            !isLiveStatus(localState.status) ||
            !data.canEdit ||
            (remoteGameId && remoteGameId !== localGameId);

          if (shouldHydrate) {
            loadGameSnapshot(data.game);
          }

          lastRemoteUpdateRef.current = data.updatedAt;
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.warn("Live game poll timeout");
        } else if (err instanceof TypeError) {
          console.error("Live game poll failed:", err);
        }
      }
    };

    void pollLiveGame();
    const timer = window.setInterval(pollLiveGame, LIVE_POLL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [isClientReady, getClientId, loadGameSnapshot, resetGame]);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId || !isLiveStatus(status)) return;

    const claimLock = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch("/api/live-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "claim",
            clientId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 409) {
          setCanEditLive(false);
          return;
        }
        setCanEditLive(response.ok);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Lock claim failed:", err);
        }
        setCanEditLive(false);
      }
    };

    void claimLock();
    const timer = window.setInterval(claimLock, LIVE_LOCK_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [isClientReady, getClientId, status]);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;

    if (isLiveStatus(status)) return;

    const action = status === "setup" ? "clear" : "release";

    void fetch("/api/live-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        clientId,
      }),
    });
  }, [isClientReady, getClientId, status]);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId || !canEditLive) return;

    const unsubscribe = useGameStore.subscribe((nextState) => {
      if (!isLiveStatus(nextState.status)) return;

      if (liveSyncTimerRef.current) {
        window.clearTimeout(liveSyncTimerRef.current);
      }

      liveSyncTimerRef.current = window.setTimeout(async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const game = JSON.parse(nextState.exportJSON()) as Record<
            string,
            unknown
          >;

          const response = await fetch("/api/live-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              clientId,
              game,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 409) {
              toast({
                variant: "destructive",
                title: "Sync blocked",
                description:
                  "Another user is editing. Your changes were not saved.",
              });
            } else {
              console.error("Sync failed with status:", response.status);
            }
            setCanEditLive(false);
            return;
          }

          const data = (await response.json()) as { updatedAt?: number };
          if (typeof data.updatedAt === "number") {
            lastRemoteUpdateRef.current = data.updatedAt;
          }
        } catch (err) {
          if (err instanceof Error) {
            if (err.name === "AbortError") {
              console.warn("Sync timeout");
            } else {
              console.error("Sync failed:", err);
            }
          }
          setCanEditLive(false);
        }
      }, 250);
    });

    return () => {
      unsubscribe();
      if (liveSyncTimerRef.current) {
        window.clearTimeout(liveSyncTimerRef.current);
        liveSyncTimerRef.current = null;
      }
    };
  }, [isClientReady, getClientId, canEditLive, toast]);

  useEffect(() => {
    if (!canEditLive || !isLiveStatus(status)) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void releaseScoringLock("hidden");
        setCanEditLive(false);
      }
    };

    const onPageHide = () => {
      void releaseScoringLock("unload");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [canEditLive, status, releaseScoringLock]);

  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pinwiscore-game-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDisconnectScoring = async () => {
    try {
      await releaseScoringLock("manual");
      setCanEditLive(false);
      toast({
        title: "Scoring control released",
        description: "Another user can now take over scoring.",
      });
    } catch (err) {
      console.error("Error releasing scoring lock:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to release scoring control. Please try again.",
      });
    }
  };

  if (!isClientReady) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top Bar with Actions (only shown during game) */}
      {status === "in-progress" && canEditLive && (
        <div className="fixed top-2 right-2 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-background/80 backdrop-blur"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Scorecard
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <PlugZap className="mr-2 h-4 w-4" />
                    Disconnect Scoring
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Disconnect scoring control?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You will switch to live view mode and another connected
                      user can take over scoring.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnectScoring}>
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Game
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all game data and return to the setup
                      screen. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={resetGame}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Reset Game
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {isReadOnlyLive && (
        <div className="fixed left-2 top-2 z-50 rounded-md border bg-background/90 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          Live view only (another user is scoring)
        </div>
      )}
      {status === "setup" ? (
        <GameSetup />
      ) : status === "finished" ? (
        <GameFinished />
      ) : shouldShowOpponentRuns ? (
        <div className={isReadOnlyLive ? "pointer-events-none opacity-90" : ""}>
          <OpponentRunsInput />
        </div>
      ) : (
        <div className={isReadOnlyLive ? "pointer-events-none opacity-90" : ""}>
          <GameScreen />
        </div>
      )}
    </main>
  );
}
