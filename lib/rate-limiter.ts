/**
 * In-memory rate limiter for AI API routes — ExamMind
 *
 * Limits requests per IP to prevent API key abuse.
 * NOTE: This in-memory store resets on cold starts (serverless). A production
 * deployment should use Redis or Vercel KV for persistent rate limiting.
 * For a hackathon/demo context, this provides meaningful protection.
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

// Map of IP -> record
const store = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window

interface RateLimitOptions {
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 20;
  const now = Date.now();

  const record = store.get(identifier);

  if (!record || now - record.windowStart > WINDOW_MS) {
    // New window
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetInMs: WINDOW_MS };
  }

  if (record.count >= maxRequests) {
    const resetInMs = WINDOW_MS - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetInMs };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInMs: WINDOW_MS - (now - record.windowStart),
  };
}

// Cleanup old entries periodically (prevents memory leak in long-running processes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.windowStart > WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}, WINDOW_MS * 5);
