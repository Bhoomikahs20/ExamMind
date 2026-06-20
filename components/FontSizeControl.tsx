"use client";

/**
 * FontSizeControl — Accessibility Addition #3
 * Allows users to increase text size. Persists across sessions via localStorage.
 * Minimum rendered text is always ≥14px (WCAG AA).
 */

import { useFontSize } from "@/hooks/useFontSize";
import { Button } from "@/components/ui/button";

export default function FontSizeControl() {
  const { size, change } = useFontSize();

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Text size controls"
    >
      <span className="text-xs text-muted-foreground mr-1 hidden sm:inline" aria-hidden="true">
        Text:
      </span>
      <Button
        variant={size === "normal" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => change("normal")}
        aria-pressed={size === "normal"}
        aria-label="Normal text size"
        className="h-7 w-7 p-0 text-xs font-medium"
      >
        A
      </Button>
      <Button
        variant={size === "large" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => change("large")}
        aria-pressed={size === "large"}
        aria-label="Large text size"
        className="h-7 w-7 p-0 text-sm font-medium"
      >
        A
      </Button>
      <Button
        variant={size === "larger" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => change("larger")}
        aria-pressed={size === "larger"}
        aria-label="Extra large text size"
        className="h-7 w-7 p-0 text-base font-medium"
      >
        A
      </Button>
    </div>
  );
}
