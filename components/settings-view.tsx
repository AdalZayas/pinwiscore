"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/game-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function normalizeHex(value: string) {
  if (!value.startsWith("#")) {
    return `#${value}`;
  }
  return value;
}

function isValidHex(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

function getPickerValue(value: string, fallback: string) {
  return isValidHex(value) ? normalizeHex(value) : fallback;
}

export function SettingsView() {
  const { primaryColor, secondaryColor, setThemeColors, resetThemeColors } =
    useGameStore();

  const [localPrimary, setLocalPrimary] = useState(primaryColor);
  const [localSecondary, setLocalSecondary] = useState(secondaryColor);

  const applyColors = () => {
    const nextPrimary = isValidHex(normalizeHex(localPrimary))
      ? normalizeHex(localPrimary)
      : primaryColor;
    const nextSecondary = isValidHex(normalizeHex(localSecondary))
      ? normalizeHex(localSecondary)
      : secondaryColor;

    setThemeColors(nextPrimary, nextSecondary);
    setLocalPrimary(nextPrimary);
    setLocalSecondary(nextSecondary);
  };

  const handleReset = () => {
    resetThemeColors();
    setLocalPrimary("#37c88f");
    setLocalSecondary("#2a2f3f");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Theme Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="primary-color"
              type="color"
              value={getPickerValue(localPrimary, "#37c88f")}
              onChange={(event) => setLocalPrimary(event.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-1"
            />
            <Input
              value={localPrimary}
              onChange={(event) => setLocalPrimary(event.target.value)}
              placeholder="#37c88f"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary-color">Secondary Color</Label>
          <div className="flex items-center gap-3">
            <input
              id="secondary-color"
              type="color"
              value={getPickerValue(localSecondary, "#2a2f3f")}
              onChange={(event) => setLocalSecondary(event.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-1"
            />
            <Input
              value={localSecondary}
              onChange={(event) => setLocalSecondary(event.target.value)}
              placeholder="#2a2f3f"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground mb-2">Preview</div>
          <div className="flex gap-2">
            <div
              className="rounded px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: localPrimary, color: "#fff" }}
            >
              Primary
            </div>
            <div
              className="rounded px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: localSecondary, color: "#fff" }}
            >
              Secondary
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyColors} className="flex-1">
            Apply Colors
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
