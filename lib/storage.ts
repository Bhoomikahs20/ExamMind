/**
 * Storage Utilities — ExamMind
 *
 * ARCHITECTURE NOTE (intentional design):
 * All user data lives entirely in the browser's localStorage. Nothing is
 * sent to or stored on any server. The anonymous deviceId is used only as a
 * local namespace key to keep entries organized — it is never transmitted.
 *
 * This is a deliberate privacy-first decision suited to the hackathon's
 * no-auth constraint. A production version would use IndexedDB for larger
 * data sets and an optional encrypted cloud sync with explicit user consent.
 */

import type {
  CheckInEntry,
  AIAnalysis,
  ChatMessage,
  StreakData,
  JournalSummary,
  StressTag,
} from "@/types";
import { format, differenceInCalendarDays, parseISO } from "date-fns";

// ---------------------------------------------------------------------------
// Device ID — anonymous, stable across sessions
// ---------------------------------------------------------------------------

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("examind_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("examind_device_id", id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const KEYS = {
  entries: "examind_entries",
  analyses: "examind_analyses",
  chatMessages: "examind_chat",
  journalSummary: "examind_journal_summary",
  todayReframe: "examind_today_reframe",
} as const;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Check-in entries
// ---------------------------------------------------------------------------

export function getEntries(): CheckInEntry[] {
  return readJSON<CheckInEntry[]>(KEYS.entries, []);
}

export function saveEntry(entry: CheckInEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  writeJSON(KEYS.entries, entries);
}

export function getEntryByDate(date: string): CheckInEntry | undefined {
  return getEntries().find((e) => e.date === date);
}

export function getTodayEntry(): CheckInEntry | undefined {
  return getEntryByDate(format(new Date(), "yyyy-MM-dd"));
}

export function getRecentEntries(days = 7): CheckInEntry[] {
  const entries = getEntries();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries
    .filter((e) => e.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
}

// ---------------------------------------------------------------------------
// AI Analyses
// ---------------------------------------------------------------------------

export function getAnalyses(): AIAnalysis[] {
  return readJSON<AIAnalysis[]>(KEYS.analyses, []);
}

export function saveAnalysis(analysis: AIAnalysis): void {
  const analyses = getAnalyses();
  const idx = analyses.findIndex((a) => a.id === analysis.id);
  if (idx >= 0) {
    analyses[idx] = analysis;
  } else {
    analyses.push(analysis);
  }
  writeJSON(KEYS.analyses, analyses);
}

export function getAnalysisForEntry(entryId: string): AIAnalysis | undefined {
  return getAnalyses().find((a) => a.entryId === entryId);
}

// ---------------------------------------------------------------------------
// Chat messages
// ---------------------------------------------------------------------------

export function getChatMessages(): ChatMessage[] {
  return readJSON<ChatMessage[]>(KEYS.chatMessages, []);
}

export function saveChatMessage(msg: ChatMessage): void {
  const msgs = getChatMessages();
  msgs.push(msg);
  // Keep last 50 messages to avoid unbounded localStorage growth
  const trimmed = msgs.slice(-50);
  writeJSON(KEYS.chatMessages, trimmed);
}

export function clearChatMessages(): void {
  writeJSON(KEYS.chatMessages, []);
}

// ---------------------------------------------------------------------------
// Streak calculation
// ---------------------------------------------------------------------------

export function calculateStreak(): StreakData {
  const entries = getEntries().sort((a, b) => b.timestamp - a.timestamp);

  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCheckInDate: null, totalCheckIns: 0 };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const lastDate = entries[0].date;
  const daysSinceLast = differenceInCalendarDays(
    parseISO(today),
    parseISO(lastDate)
  );

  // Streak breaks if last check-in was more than 1 day ago
  if (daysSinceLast > 1) {
    return {
      currentStreak: 0,
      longestStreak: calculateLongestStreak(entries),
      lastCheckInDate: lastDate,
      totalCheckIns: entries.length,
    };
  }

  // Count consecutive days backwards
  let current = 1;
  for (let i = 1; i < entries.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(entries[i - 1].date),
      parseISO(entries[i].date)
    );
    if (diff === 1) {
      current++;
    } else {
      break;
    }
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(current, calculateLongestStreak(entries)),
    lastCheckInDate: lastDate,
    totalCheckIns: entries.length,
  };
}

function calculateLongestStreak(
  sortedDesc: CheckInEntry[]
): number {
  if (sortedDesc.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDesc.length; i++) {
    const diff = differenceInCalendarDays(
      parseISO(sortedDesc[i - 1].date),
      parseISO(sortedDesc[i].date)
    );
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

// ---------------------------------------------------------------------------
// Mood trend helpers
// ---------------------------------------------------------------------------

export function getMoodTrend(days = 7): { date: string; mood: number }[] {
  const entries = getRecentEntries(days);
  return entries.map((e) => ({ date: e.date, mood: e.mood }));
}

export function getTagFrequency(
  days = 7
): { tag: StressTag; count: number }[] {
  const entries = getRecentEntries(days);
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag: tag as StressTag, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Rolling journal summary (compressed history for LLM)
// ---------------------------------------------------------------------------

export function getJournalSummary(): JournalSummary | null {
  return readJSON<JournalSummary | null>(KEYS.journalSummary, null);
}

export function saveJournalSummary(summary: JournalSummary): void {
  writeJSON(KEYS.journalSummary, summary);
}

// ---------------------------------------------------------------------------
// Today's reframe card
// ---------------------------------------------------------------------------

export function getTodayReframe(): { text: string; date: string } | null {
  return readJSON(KEYS.todayReframe, null);
}

export function saveTodayReframe(text: string): void {
  writeJSON(KEYS.todayReframe, {
    text,
    date: format(new Date(), "yyyy-MM-dd"),
  });
}

// ---------------------------------------------------------------------------
// Demo data seeding (for judges / reviewers)
// ---------------------------------------------------------------------------

export function seedDemoData(): void {
  const today = new Date();
  const demoEntries: CheckInEntry[] = [];
  const demoAnalyses: AIAnalysis[] = [];

  const moods: [number, string, StressTag[]][] = [
    [2, "Mock test tomorrow and I haven't finished half the syllabus. Can't sleep properly, my mind just keeps racing thinking about what topics I haven't covered yet. My parents keep asking how my preparation is going and I don't know what to say.", ["sleep", "syllabus_pressure", "family_expectations"]],
    [3, "Studied for 8 hours today. Felt okay but tired. Comparison with Rahul who seems to solve everything faster is getting to me. Did some revision and it went better than expected.", ["syllabus_pressure", "comparison_anxiety"]],
    [2, "Really bad day. Couldn't concentrate at all. My mock score came back and it was lower than last month. Feeling like all my effort isn't showing results. Exam fear is at peak right now.", ["exam_fear", "syllabus_pressure"]],
    [4, "Took a proper break today for the first time in weeks. Went for a walk, ate properly. Brain feels clearer. Finished a chapter I'd been dreading — it wasn't as bad as I thought.", ["burnout"]],
    [3, "Average day. Did organic chemistry revision. Family gathering in the evening that I couldn't get out of, lost 3 hours. Feeling behind schedule again.", ["family_expectations", "time_management"]],
    [4, "Good day! Solved 30 practice problems in Physics and got 24 right — that's my best so far. Starting to feel like this might actually work if I stay consistent.", ["syllabus_pressure"]],
    [2, "Two months to exam. Anxiety is hitting different today. Woke up at 3am thinking about the result. Can't keep comparing myself to others but I keep doing it anyway. Need to find a way to calm down.", ["exam_fear", "comparison_anxiety", "sleep"]],
  ];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const [mood, text, tags] = moods[6 - i];

    const entryId = `demo-entry-${i}`;
    const analysisId = `demo-analysis-${i}`;

    demoEntries.push({
      id: entryId,
      date: dateStr,
      timestamp: date.getTime(),
      mood: mood as 1 | 2 | 3 | 4 | 5,
      journalText: text,
      tags,
      analysisId,
    });

    const insights = [
      "Sleep disruption and academic pressure often amplify each other — addressing one helps the other.",
      "The comparison with peers is a normal stress response, but your progress is best measured against your own past self.",
      "A lower mock score can be data, not a verdict. It shows exactly what to work on next.",
      "Your mind and body responded well to that break. Rest is part of the preparation, not a break from it.",
      "Interruptions are frustrating, but you adapted and kept going. That resilience matters.",
      "Seeing measurable progress — 24/30 — is powerful evidence to revisit on harder days.",
      "Night anxiety before exams is extremely common. The fact that you're aware of the comparison trap is the first step to stepping out of it.",
    ];

    demoAnalyses.push({
      id: analysisId,
      entryId,
      date: dateStr,
      stress_triggers: tags,
      emotional_tone: mood <= 2 ? "anxious" : mood === 3 ? "neutral" : "hopeful",
      intensity_score: mood <= 2 ? 7 + Math.floor(Math.random() * 2) : mood === 3 ? 5 : 3,
      recurring_pattern: "Stress peaks around mock test results and syllabus coverage gaps",
      reflective_insight: insights[6 - i],
      suggested_tags: tags,
      analyzed_at: date.getTime(),
    });
  }

  writeJSON(KEYS.entries, demoEntries);
  writeJSON(KEYS.analyses, demoAnalyses);
  writeJSON(KEYS.chatMessages, []);
}

export function clearAllData(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
