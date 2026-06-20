/**
 * Mood and trend aggregation utilities — ExamMind
 */

import type { MoodLevel, CheckInEntry, AIAnalysis, WellnessSummary, StressTag } from "@/types";
import { format, parseISO, differenceInCalendarDays } from "date-fns";

export const MOOD_CONFIG: Record<
  MoodLevel,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  1: { label: "Overwhelmed", emoji: "😰", color: "#ef4444", bgColor: "#fee2e2" },
  2: { label: "Stressed", emoji: "😟", color: "#f97316", bgColor: "#ffedd5" },
  3: { label: "Okay", emoji: "😐", color: "#eab308", bgColor: "#fef9c3" },
  4: { label: "Good", emoji: "🙂", color: "#22c55e", bgColor: "#dcfce7" },
  5: { label: "Energized", emoji: "😄", color: "#3b82f6", bgColor: "#dbeafe" },
};

export const TAG_LABELS: Record<StressTag, string> = {
  sleep: "Sleep Issues",
  syllabus_pressure: "Syllabus Pressure",
  comparison_anxiety: "Comparison Anxiety",
  family_expectations: "Family Expectations",
  exam_fear: "Exam Fear",
  burnout: "Burnout",
  time_management: "Time Management",
};

export function getMoodConfig(mood: MoodLevel) {
  return MOOD_CONFIG[mood];
}

export function averageMood(entries: CheckInEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.mood, 0) / entries.length;
}

export function moodTrendDirection(
  entries: CheckInEntry[]
): "improving" | "declining" | "stable" {
  if (entries.length < 2) return "stable";
  const first = entries.slice(0, Math.ceil(entries.length / 2));
  const second = entries.slice(Math.ceil(entries.length / 2));
  const firstAvg = averageMood(first);
  const secondAvg = averageMood(second);
  const diff = secondAvg - firstAvg;
  if (diff > 0.3) return "improving";
  if (diff < -0.3) return "declining";
  return "stable";
}

export function buildWellnessSummary(
  entries: CheckInEntry[],
  analyses: AIAnalysis[],
  weeklyInsight: string
): WellnessSummary {
  const moodTrend = entries.map((e) => ({ date: e.date, mood: e.mood }));

  // Collect all tags from both entries and analyses
  const tagCounts: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  for (const analysis of analyses) {
    for (const tag of analysis.stress_triggers) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 0.5; // weight analysis tags less
    }
  }

  const topTriggers = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Streak calculation inline (avoiding circular import)
  const sortedDesc = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  if (sortedDesc.length > 0) {
    const today = format(new Date(), "yyyy-MM-dd");
    const lastDate = sortedDesc[0].date;
    const daysSinceLast = differenceInCalendarDays(
      parseISO(today),
      parseISO(lastDate)
    );
    if (daysSinceLast <= 1) {
      streak = 1;
      for (let i = 1; i < sortedDesc.length; i++) {
        const diff = differenceInCalendarDays(
          parseISO(sortedDesc[i - 1].date),
          parseISO(sortedDesc[i].date)
        );
        if (diff === 1) streak++;
        else break;
      }
    }
  }

  return {
    generatedAt: Date.now(),
    periodDays: entries.length,
    averageMood: averageMood(entries),
    moodTrend,
    topTriggers,
    streakData: {
      currentStreak: streak,
      longestStreak: streak,
      lastCheckInDate: sortedDesc[0]?.date ?? null,
      totalCheckIns: entries.length,
    },
    weeklyInsight,
  };
}

/**
 * Sanitize user text before sending to LLM.
 * - Trim whitespace
 * - Cap length to prevent token abuse
 * - Strip null bytes
 */
export function sanitizeUserText(text: string, maxLength = 2000): string {
  return text
    .replace(/\0/g, "") // null bytes
    .trim()
    .slice(0, maxLength);
}
