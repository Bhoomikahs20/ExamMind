"use client";

/**
 * Dashboard — mood trend charts + weekly pattern summary
 * Lazy-loads chart components for efficiency.
 */

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TAG_LABELS, MOOD_CONFIG } from "@/lib/mood-utils";
import type { CheckInEntry, AIAnalysis } from "@/types";
import StressPatternTimeline from "@/components/StressPatternTimeline";

// Lazy-load chart components
const MoodChart = dynamic(() => import("@/components/charts/MoodChart"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
      Loading chart…
    </div>
  ),
});

const TriggerChart = dynamic(() => import("@/components/charts/TriggerChart"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
      Loading chart…
    </div>
  ),
});

interface DashboardProps {
  entries: CheckInEntry[];
  analyses: AIAnalysis[];
  weeklyInsight?: string;
}

export default function Dashboard({ entries, analyses, weeklyInsight }: DashboardProps) {
  const moodTrend = useMemo(
    () => entries.slice(-7).map((e) => ({ date: e.date, mood: e.mood })),
    [entries]
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of entries.slice(-7)) {
      for (const tag of entry.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [entries]);

  const avgMood = useMemo(() => {
    if (!moodTrend.length) return 0;
    return moodTrend.reduce((s, e) => s + e.mood, 0) / moodTrend.length;
  }, [moodTrend]);

  const trendDirection = useMemo(() => {
    if (moodTrend.length < 2) return "stable";
    const first = moodTrend.slice(0, Math.ceil(moodTrend.length / 2));
    const second = moodTrend.slice(Math.ceil(moodTrend.length / 2));
    const f = first.reduce((s, e) => s + e.mood, 0) / first.length;
    const s = second.reduce((s, e) => s + e.mood, 0) / second.length;
    if (s - f > 0.3) return "improving";
    if (f - s > 0.3) return "declining";
    return "stable";
  }, [moodTrend]);

  const latestAnalysis = useMemo(() => {
    const sorted = [...analyses].sort((a, b) => b.analyzed_at - a.analyzed_at);
    return sorted[0] ?? null;
  }, [analyses]);

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">
            No check-ins yet. Complete your first check-in to see your wellness dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon =
    trendDirection === "improving"
      ? TrendingUp
      : trendDirection === "declining"
      ? TrendingDown
      : Minus;

  const trendColor =
    trendDirection === "improving"
      ? "text-green-600"
      : trendDirection === "declining"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: MOOD_CONFIG[Math.round(avgMood) as 1 | 2 | 3 | 4 | 5]?.color }}>
              {avgMood.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Avg mood (7d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendIcon className={`h-6 w-6 mx-auto ${trendColor}`} aria-hidden="true" />
            <p className="text-xs text-muted-foreground capitalize">{trendDirection}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Mood over the last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MoodChart data={moodTrend} />
        </CardContent>
      </Card>

      {/* Trigger frequency */}
      {tagCounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top stress triggers this week</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TriggerChart data={tagCounts} />
          </CardContent>
        </Card>
      )}

      {/* Stress pattern timeline — 14-day cross-reference */}
      <StressPatternTimeline entries={entries} analyses={analyses} />

      {/* Weekly insight */}
      {(weeklyInsight || latestAnalysis?.recurring_pattern) && (
        <Card className="bg-violet-50 border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-violet-800">
              <Brain className="h-4 w-4" aria-hidden="true" />
              Patterns we noticed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {weeklyInsight && (
              <p className="text-sm text-violet-700 mb-2">{weeklyInsight}</p>
            )}
            {latestAnalysis?.recurring_pattern && latestAnalysis.recurring_pattern !== "insufficient data" && (
              <p className="text-xs text-violet-600 italic">
                Pattern: {latestAnalysis.recurring_pattern}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent analysis */}
      {latestAnalysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest insight</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <p className="text-sm text-foreground">{latestAnalysis.reflective_insight}</p>
            <div className="flex flex-wrap gap-1.5">
              {latestAnalysis.stress_triggers.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {TAG_LABELS[tag] ?? tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Intensity: {latestAnalysis.intensity_score}/10 · Tone: {latestAnalysis.emotional_tone}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
