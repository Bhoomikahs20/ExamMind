/**
 * AI Provider Abstraction — ExamMind
 * Supports GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.
 * Swap providers by changing one env var — nothing else changes.
 * SECURITY: Server-side only. Keys never reach the client bundle.
 */

export type AIProvider = "gemini" | "anthropic" | "openai";

function getProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new Error("No AI provider configured. Set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local");
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const provider = getProvider();
  const maxTokens = options.maxTokens ?? 1024;
  if (provider === "gemini") return geminiCompletion(systemPrompt, userMessage, maxTokens, options.jsonMode ?? false);
  if (provider === "openai") return openaiCompletion(systemPrompt, userMessage, maxTokens, options.jsonMode ?? false);
  return anthropicCompletion(systemPrompt, userMessage, maxTokens);
}

export async function generateStream(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  options: { maxTokens?: number } = {}
): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();
  const maxTokens = options.maxTokens ?? 512;
  if (provider === "gemini") return geminiStream(systemPrompt, messages, maxTokens);
  if (provider === "openai") return openaiStream(systemPrompt, messages, maxTokens);
  return anthropicStream(systemPrompt, messages, maxTokens);
}

// --- OpenAI ---
async function openaiCompletion(system: string, user: string, maxTokens: number, jsonMode: boolean): Promise<string> {
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

async function openaiStream(system: string, messages: { role: "user" | "assistant"; content: string }[], maxTokens: number): Promise<ReadableStream<Uint8Array>> {
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
  return parseOpenAISSEStream(res.body!);
}

function parseOpenAISSEStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
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
              const parsed = JSON.parse(jsonStr);
              const text = parsed.choices?.[0]?.delta?.content ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip */ }
          }
        }
      } finally { controller.close(); reader.releaseLock(); }
    },
  });
}

// --- Gemini ---
async function geminiCompletion(system: string, user: string, maxTokens: number, jsonMode: boolean): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: maxTokens, ...(jsonMode ? { responseMimeType: "application/json" } : {}) },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function geminiStream(system: string, messages: { role: "user" | "assistant"; content: string }[], maxTokens: number): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const contents = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: maxTokens } }),
  });
  if (!res.ok) throw new Error(`Gemini stream error ${res.status}`);
  const encoder = new TextEncoder(); const decoder = new TextDecoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader(); let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim(); if (!j || j === "[DONE]") continue;
            try { const p = JSON.parse(j); const t = p.candidates?.[0]?.content?.parts?.[0]?.text ?? ""; if (t) controller.enqueue(encoder.encode(t)); } catch { /**/ }
          }
        }
      } finally { controller.close(); reader.releaseLock(); }
    },
  });
}

// --- Anthropic ---
async function anthropicCompletion(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function anthropicStream(system: string, messages: { role: "user" | "assistant"; content: string }[], maxTokens: number): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: maxTokens, stream: true, system, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic stream error ${res.status}`);
  const encoder = new TextEncoder(); const decoder = new TextDecoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader(); let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim(); if (!j || j === "[DONE]") continue;
            try { const p = JSON.parse(j); if (p.type === "content_block_delta") { const t = p.delta?.text ?? ""; if (t) controller.enqueue(encoder.encode(t)); } } catch { /**/ }
          }
        }
      } finally { controller.close(); reader.releaseLock(); }
    },
  });
}