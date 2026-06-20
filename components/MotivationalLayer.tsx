"use client";

/**
 * StreakCard + ReframeCard — Motivational layer
 */

import { useState, useEffect } from "react";
import { Flame, Trophy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateStreak, getEntries, getTodayReframe, saveTodayReframe } from "@/lib/storage";
import { format } from "date-fns";
import type { StreakData } from "@/types";

export function StreakCard() {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    setStreak(calculateStreak());
  }, []);

  if (!streak) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative">
          <Flame
            className="h-10 w-10 text-orange-400"
            aria-hidden="true"
          />
          {streak.currentStreak >= 7 && (
            <Trophy className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-700" aria-label={`${streak.currentStreak} day streak`}>
            {streak.currentStreak}
            <span className="text-sm font-normal text-orange-500 ml-1">
              {streak.currentStreak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="text-xs text-amber-700">
            {streak.currentStreak === 0
              ? "Start your streak today"
              : streak.currentStreak === 1
              ? "Streak started — keep going!"
              : `${streak.currentStreak}-day check-in streak 🔥`}
          </p>
          {streak.longestStreak > streak.currentStreak && (
            <p className="text-xs text-amber-500">Best: {streak.longestStreak} days</p>
          )}
          <p className="text-xs text-amber-600 mt-0.5">{streak.totalCheckIns} total check-ins</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReframeCard() {
  const [reframe, setReframe] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if we already have today's reframe
    const saved = getTodayReframe();
    const today = format(new Date(), "yyyy-MM-dd");
    if (saved && saved.date === today) {
      setReframe(saved.text);
      setLoaded(true);
      return;
    }
    generateReframe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReframe = async () => {
    setLoading(true);
    const entries = getEntries().slice(-7);
    const streak = calculateStreak();
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
          recentHighlights: highlights || "The student has been showing up consistently for their preparation.",
          streakDays: streak.currentStreak,
        }),
      });
      const data = await res.json();
      if (data.reframe) {
        setReframe(data.reframe);
        saveTodayReframe(data.reframe);
        setLoaded(true);
      }
    } catch {
      setReframe("You showed up today. That matters more than you think.");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            <p className="text-xs font-medium text-violet-700 uppercase tracking-wide">
              Today&apos;s reframe
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateReframe}
            disabled={loading}
            className="h-6 w-6 text-violet-400"
            aria-label="Refresh today's reframe"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Personalizing…</span>
          </div>
        ) : (
          <p className="text-sm text-violet-800 leading-relaxed" aria-live="polite">
            {reframe || "Your personalized reframe is on the way."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}