/**
 * AI Provider Abstraction - ExamMind
 * Supports GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.
 * Falls back to demo mode if no key is set (app still works).
 * SECURITY: Server-side only. Keys never reach the client bundle.
 */

export type AIProvider = "gemini" | "anthropic" | "openai" | "demo";

function getProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "demo";
}

// ---------------------------------------------------------------------------
// Non-streaming completion
// ---------------------------------------------------------------------------

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const provider = getProvider();
  const maxTokens = options.maxTokens ?? 1024;
  const jsonMode = options.jsonMode ?? false;

  switch (provider) {
    case "demo":    return demoCompletion(jsonMode);
    case "gemini":  return geminiCompletion(systemPrompt, userMessage, maxTokens, jsonMode);
    case "openai":  return openaiCompletion(systemPrompt, userMessage, maxTokens, jsonMode);
    case "anthropic": return anthropicCompletion(systemPrompt, userMessage, maxTokens);
  }
}

// ---------------------------------------------------------------------------
// Streaming completion
// ---------------------------------------------------------------------------

export async function generateStream(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  options: { maxTokens?: number } = {}
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();
  const maxTokens = options.maxTokens ?? 512;

  switch (provider) {
    case "demo":      return demoStream();
    case "gemini":    return geminiStream(systemPrompt, messages, maxTokens);
    case "openai":    return openaiStream(systemPrompt, messages, maxTokens);
    case "anthropic": return anthropicStream(systemPrompt, messages, maxTokens);
  }
}

// ---------------------------------------------------------------------------
// DEMO — works with no API key (for local testing and judges without keys)
// ---------------------------------------------------------------------------

function demoCompletion(jsonMode: boolean): Promise<string> {
  if (jsonMode) {
    return Promise.resolve(JSON.stringify({
      stress_triggers: ["exam_fear", "syllabus_pressure"],
      emotional_tone: "anxious but motivated",
      intensity_score: 6,
      recurring_pattern: "Stress increases before mock tests and eases after completing tasks.",
      reflective_insight: "Breaking revision into smaller chunks tends to reduce your anxiety.",
      suggested_tags: ["exam_fear", "time_management"],
    }));
  }
  return Promise.resolve(
    "I'm running in demo mode — add a GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your .env.local (or Vercel environment variables) to enable live AI responses. " +
    "The rest of the app — mood tracking, charts, exercises, streak — works fully right now!"
  );
}

function demoStream(): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const text =
    "Hi! I'm ExamMind in demo mode. To enable live AI chat, add a GEMINI_API_KEY (free at aistudio.google.com/apikey), OPENAI_API_KEY, or ANTHROPIC_API_KEY to your environment variables. All other features work right now — try the mood check-in and exercises!";
  return Promise.resolve(
    new ReadableStream<Uint8Array>({
      start(controller) {
        // Stream word by word for a realistic typing effect
        const words = text.split(" ");
        let i = 0;
        const interval = setInterval(() => {
          if (i < words.length) {
            controller.enqueue(encoder.encode((i > 0 ? " " : "") + words[i]));
            i++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 40);
      },
    })
  );
}

// ---------------------------------------------------------------------------
// GEMINI
// ---------------------------------------------------------------------------

async function geminiCompletion(
  system: string, user: string, maxTokens: number, jsonMode: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function geminiStream(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  maxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini stream error ${res.status}: ${await res.text()}`);
  return parseSSEStream(res.body!, (parsed) => parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
}

// ---------------------------------------------------------------------------
// OPENAI
// ---------------------------------------------------------------------------

async function openaiCompletion(
  system: string, user: string, maxTokens: number, jsonMode: boolean
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function openaiStream(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  maxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI stream error ${res.status}: ${await res.text()}`);
  return parseSSEStream(res.body!, (parsed) => parsed.choices?.[0]?.delta?.content ?? "");
}

// ---------------------------------------------------------------------------
// ANTHROPIC
// ---------------------------------------------------------------------------

async function anthropicCompletion(
  system: string, user: string, maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function anthropicStream(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  maxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      stream: true,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic stream error ${res.status}: ${await res.text()}`);
  return parseSSEStream(res.body!, (parsed) =>
    parsed.type === "content_block_delta" ? (parsed.delta?.text ?? "") : ""
  );
}

// ---------------------------------------------------------------------------
// Shared SSE parser
// ---------------------------------------------------------------------------

function parseSSEStream(
  source: ReadableStream<Uint8Array>,
  extractText: (parsed: Record<string, unknown>) => string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
              const text = extractText(parsed);
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}