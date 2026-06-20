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

// ---------------------------------------------------------------------------
// Stress pattern timeline (Addition #1)
// ---------------------------------------------------------------------------

export interface StressTimelineCallout {
  type: "rising_before_trigger" | "recovery_after_high" | "recurring_tag" | "sustained_low";
  message: string;
  date?: string;
}

/**
 * Derives plain-language callouts from 14 days of entries + analyses.
 * Cross-references mood intensity trends with detected stress_triggers.
 * Returns up to 3 most meaningful callouts.
 */
export function deriveStressTimeline(
  entries: CheckInEntry[],
  analyses: AIAnalysis[]
): StressTimelineCallout[] {
  const callouts: StressTimelineCallout[] = [];

  // Sort chronologically, last 14 days
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = [...entries]
    .filter((e) => e.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 3) return callouts;

  // Build analysis map for quick lookup
  const analysisMap = new Map<string, AIAnalysis>();
  for (const a of analyses) {
    analysisMap.set(a.entryId, a);
  }

  // --- Pattern 1: Intensity rising before a high-tag day ---
  for (let i = 2; i < recent.length; i++) {
    const curr = recent[i];
    const prev = recent[i - 1];
    const prev2 = recent[i - 2];
    const currAnalysis = analysisMap.get(curr.id);
    const dominantTag = currAnalysis?.stress_triggers[0] ?? curr.tags[0];

    const intensityRising =
      curr.mood <= 2 && prev.mood <= prev2.mood && prev.mood <= curr.mood + 1;

    if (intensityRising && dominantTag) {
      const daysBefore = differenceInCalendarDays(
        parseISO(curr.date),
        parseISO(prev2.date)
      );
      if (daysBefore <= 4 && daysBefore >= 1) {
        callouts.push({
          type: "rising_before_trigger",
          message: `Stress rose steadily over ${daysBefore} days leading up to a low-mood entry tagged with "${TAG_LABELS[dominantTag as StressTag] ?? dominantTag}".`,
          date: curr.date,
        });
        break; // one callout of this type is enough
      }
    }
  }

  // --- Pattern 2: Recovery — mood improved ≥2 points after a high-stress day ---
  for (let i = 1; i < recent.length; i++) {
    const curr = recent[i];
    const prev = recent[i - 1];
    if (curr.mood - prev.mood >= 2 && prev.mood <= 2) {
      const daysBetween = differenceInCalendarDays(
        parseISO(curr.date),
        parseISO(prev.date)
      );
      if (daysBetween <= 3) {
        callouts.push({
          type: "recovery_after_high",
          message: `Your mood bounced back by ${curr.mood - prev.mood} points within ${daysBetween} day${daysBetween > 1 ? "s" : ""} — your recovery pattern is quicker than you may realise.`,
          date: curr.date,
        });
        break;
      }
    }
  }

  // --- Pattern 3: Recurring tag appearing ≥3 times in the window ---
  const tagCount: Record<string, number> = {};
  for (const entry of recent) {
    for (const tag of entry.tags) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1;
    }
  }
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  if (topTag && topTag[1] >= 3) {
    const label = TAG_LABELS[topTag[0] as StressTag] ?? topTag[0];
    callouts.push({
      type: "recurring_tag",
      message: `"${label}" has shown up in ${topTag[1]} of your last ${recent.length} entries — this seems to be a consistent pressure point right now.`,
    });
  }

  // --- Pattern 4: Sustained low — 3+ consecutive low-mood days ---
  let lowStreak = 0;
  let lowStart = "";
  for (const entry of recent) {
    if (entry.mood <= 2) {
      if (lowStreak === 0) lowStart = entry.date;
      lowStreak++;
    } else {
      lowStreak = 0;
      lowStart = "";
    }
    if (lowStreak >= 3) {
      callouts.push({
        type: "sustained_low",
        message: `You had ${lowStreak} consecutive low-mood days starting ${format(parseISO(lowStart), "MMM d")}. That kind of sustained pressure deserves attention — a short recovery break often helps more than pushing through.`,
        date: lowStart,
      });
      break;
    }
  }

  // Return top 3 callouts, deduped by type
  const seen = new Set<string>();
  return callouts.filter((c) => {
    if (seen.has(c.type)) return false;
    seen.add(c.type);
    return true;
  }).slice(0, 3);
}
