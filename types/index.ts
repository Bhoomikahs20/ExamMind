/**
 * ExamMind – core TypeScript types
 * All data is stored client-side only. Nothing personally identifiable
 * is ever transmitted to the server (see ARCHITECTURE.md / README).
 */

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type StressTag =
  | "sleep"
  | "syllabus_pressure"
  | "comparison_anxiety"
  | "family_expectations"
  | "exam_fear"
  | "burnout"
  | "time_management";

export interface CheckInEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  mood: MoodLevel;
  journalText: string;
  tags: StressTag[];
  analysisId?: string; // reference to AIAnalysis
}

export interface AIAnalysis {
  id: string;
  entryId: string;
  date: string;
  stress_triggers: StressTag[];
  emotional_tone: string;
  intensity_score: number; // 1–10
  recurring_pattern: string;
  reflective_insight: string;
  suggested_tags: StressTag[];
  analyzed_at: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  totalCheckIns: number;
}

export interface WellnessSummary {
  generatedAt: number;
  periodDays: number;
  averageMood: number;
  moodTrend: { date: string; mood: number }[];
  topTriggers: { tag: string; count: number }[];
  streakData: StreakData;
  weeklyInsight: string;
}

export type ExerciseType =
  | "box_breathing"
  | "grounding"
  | "name_three"
  | "pep_talk"
  | "progressive_relaxation"
  | "mindful_pause";

export interface Exercise {
  id: ExerciseType;
  title: string;
  description: string;
  durationMin: number;
  recommendedFor: { minIntensity: number; maxIntensity: number };
}

export type CrisisLevel = "none" | "watch" | "alert";

export interface CrisisCheckResult {
  level: CrisisLevel;
  matchedKeywords: string[];
}

// Rolling summary sent to LLM – never raw journal text after first compression
export interface JournalSummary {
  generatedAt: number;
  entryCount: number;
  summary: string; // LLM-generated prose summary of the last N entries
  averageIntensity: number;
  dominantTriggers: StressTag[];
}
