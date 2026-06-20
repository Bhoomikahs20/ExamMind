/**
 * Zod validation schemas for all API routes — ExamMind
 * Centralised here so routes stay thin and schemas are testable.
 */

import { z } from "zod";

const VALID_TAGS = [
  "sleep",
  "syllabus_pressure",
  "comparison_anxiety",
  "family_expectations",
  "exam_fear",
  "burnout",
  "time_management",
] as const;

export const AnalyzeSchema = z.object({
  journalText: z
    .string({ required_error: "journalText is required" })
    .min(5, "Journal entry must be at least 5 characters")
    .max(2000, "Journal entry must be 2000 characters or fewer"),
  rollingSummary: z.string().max(800).optional().default(""),
  recentMoods: z
    .array(z.number().int().min(1).max(5))
    .max(14)
    .optional()
    .default([]),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(1000, "Message must be 1000 characters or fewer"),
});

export const ChatSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, "At least one message is required")
    .max(20, "Too many messages"),
  moodContext: z.string().max(500).optional().default(""),
});

export const ReframeSchema = z.object({
  recentHighlights: z.string().max(500).optional().default(""),
  streakDays: z.number().int().min(0).max(365).optional().default(0),
});

export const WeeklySummarySchema = z.object({
  moodTrend: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        mood: z.number().int().min(1).max(5),
      })
    )
    .max(14)
    .optional()
    .default([]),
  topTriggers: z
    .array(
      z.object({
        tag: z.string().max(50),
        count: z.number().int().min(0),
      })
    )
    .max(10)
    .optional()
    .default([]),
  averageMood: z.number().min(1).max(5).optional().default(3),
});

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
export type ChatInput = z.infer<typeof ChatSchema>;
export type ReframeInput = z.infer<typeof ReframeSchema>;
export type WeeklySummaryInput = z.infer<typeof WeeklySummarySchema>;
