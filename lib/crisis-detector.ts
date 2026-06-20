/**
 * Crisis Safety Layer — ExamMind
 *
 * This module runs a lightweight keyword + pattern check on EVERY piece of
 * user-generated text BEFORE it reaches the general-purpose AI flow.
 *
 * Design principles:
 *  - False negatives are worse than false positives: err on the side of caution.
 *  - We do NOT attempt to "handle" a crisis with AI. We interrupt and show
 *    verified helpline information.
 *  - We do NOT diagnose or label the student; the UI message is calm and neutral.
 *  - This module is pure and synchronous so it can run before any async call.
 */

import type { CrisisCheckResult, CrisisLevel } from "@/types";

// ---------------------------------------------------------------------------
// Keyword lists — ordered from most severe (alert) to cautionary (watch)
// ---------------------------------------------------------------------------

const ALERT_PATTERNS: RegExp[] = [
  // Self-harm / suicidal ideation
  /\b(want to die|wanna die|wish i was dead|wish i were dead)\b/i,
  /\b(kill myself|end my life|take my (own )?life)\b/i,
  /\b(suicid(e|al)|self.?harm|cut(ting)? myself)\b/i,
  /\b(no reason to live|can't go on|can't take it anymore)\b/i,
  /\b(better off (without me|dead)|no point (in )?living)\b/i,
  /\b(hurt myself|harming myself|pills? to (sleep|die))\b/i,
];

const WATCH_PATTERNS: RegExp[] = [
  /\b(hopeless|worthless|useless|nobody cares)\b/i,
  /\b(give up|giving up|quit everything|disappear)\b/i,
  /\b(can't do this anymore|too much pain|unbearable)\b/i,
  /\b(hate myself|hate my life|sick of (everything|life))\b/i,
  /\b(completely alone|no one understands|no one (to )?help)\b/i,
  /\b(not sleeping|stopped eating|can't eat|can't sleep for days)\b/i,
];

// ---------------------------------------------------------------------------

export function detectCrisis(text: string): CrisisCheckResult {
  if (!text || text.trim().length === 0) {
    return { level: "none", matchedKeywords: [] };
  }

  const matched: string[] = [];

  for (const pattern of ALERT_PATTERNS) {
    const m = text.match(pattern);
    if (m) matched.push(m[0]);
  }

  if (matched.length > 0) {
    return { level: "alert", matchedKeywords: matched };
  }

  for (const pattern of WATCH_PATTERNS) {
    const m = text.match(pattern);
    if (m) matched.push(m[0]);
  }

  const level: CrisisLevel = matched.length > 0 ? "watch" : "none";
  return { level, matchedKeywords: matched };
}

export function isCrisisLevel(level: CrisisLevel): boolean {
  return level === "alert" || level === "watch";
}
