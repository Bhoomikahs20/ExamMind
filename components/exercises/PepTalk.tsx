"use client";

/**
 * Pre-Exam Pep Talk generator
 * Calls /api/reframe with recent journal highlights and streak data.
 */

import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEntries, calculateStreak } from "@/lib/storage";

export default function PepTalk() {
  const [reframe, setReframe] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);

    const entries = getEntries().slice(-7);
    const streak = calculateStreak();

    // Extract positive snippets from recent journal entries (high-mood days)
    const highlights = entries
      .filter((e) => e.mood >= 4)
      .slice(-3)
      .map((e) => e.journalText.slice(0, 100))
      .join(" | ");

    try {
      const res = await fetch("/api/reframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentHighlights: highlights || "The student has been showing up consistently.",
          streakDays: streak.currentStreak,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setReframe(data.reframe);
    } catch (err) {
      setError("Couldn't generate a pep talk right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-semibold">Your Pep Talk</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Generated from your own recent wins — not a generic quote.
        </p>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5 min-h-[100px] flex items-center justify-center">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="text-sm">Gathering your wins…</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p
            className="text-base font-medium text-violet-800 leading-relaxed text-center"
            role="status"
            aria-live="polite"
          >
            {reframe || "Your pep talk will appear here."}
          </p>
        )}
      </div>

      <Button
        onClick={generate}
        variant="outline"
        disabled={loading}
        className="w-full"
        aria-label="Generate a new pep talk"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1.5" aria-hidden="true" />
        )}
        Generate another
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        <Sparkles className="h-3 w-3 inline mr-0.5" aria-hidden="true" />
        Based on your {getEntries().length} journal entries
      </p>
    </div>
  );
}
