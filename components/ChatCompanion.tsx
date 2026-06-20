"use client";

/**
 * ChatCompanion — Streaming AI companion chat
 *
 * - Passes a mood/journal SUMMARY (not raw text) to the API for context
 * - Streams tokens using ReadableStream
 * - Crisis check happens server-side; client shows CrisisCard on trigger
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import { Send, Loader2, Trash2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import CrisisCard from "@/components/CrisisCard";
import { getChatMessages, saveChatMessage, clearChatMessages } from "@/lib/storage";
import type { ChatMessage, CheckInEntry, AIAnalysis } from "@/types";
import { MOOD_CONFIG } from "@/lib/mood-utils";

interface ChatCompanionProps {
  recentEntry?: CheckInEntry;
  recentAnalysis?: AIAnalysis;
}

function buildMoodContext(entry?: CheckInEntry, analysis?: AIAnalysis): string {
  if (!entry) return "";
  const moodLabel = MOOD_CONFIG[entry.mood]?.label ?? String(entry.mood);
  const parts = [
    `Student's mood today: ${moodLabel} (${entry.mood}/5)`,
    analysis ? `Stress intensity: ${analysis.intensity_score}/10` : "",
    analysis?.emotional_tone ? `Emotional tone: ${analysis.emotional_tone}` : "",
    analysis?.stress_triggers?.length
      ? `Active stressors: ${analysis.stress_triggers.join(", ")}`
      : "",
    analysis?.recurring_pattern && analysis.recurring_pattern !== "insufficient data"
      ? `Recurring pattern: ${analysis.recurring_pattern}`
      : "",
  ];
  return parts.filter(Boolean).join(". ");
}

export default function ChatCompanion({ recentEntry, recentAnalysis }: ChatCompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<"watch" | "alert">("watch");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted messages on mount
  useEffect(() => {
    setMessages(getChatMessages());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveChatMessage(userMsg);
    setInput("");

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          moodContext: buildMoodContext(recentEntry, recentAnalysis),
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      // Handle JSON responses (crisis detection, errors)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.crisisDetected) {
          setCrisisLevel(data.level);
          setShowCrisis(true);
          // Remove the empty assistant message
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
        const errMsg = data.error ?? "Something went wrong.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errMsg } : m
          )
        );
        saveChatMessage({ ...assistantMsg, content: errMsg });
        return;
      }

      // Stream text/plain chunks
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }

      saveChatMessage({ ...assistantMsg, content: accumulated });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Chat error:", err);
      const errContent = "Couldn't reach the AI right now. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: errContent } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, recentEntry, recentAnalysis]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    clearChatMessages();
  }, []);

  const STARTERS = [
    "I'm feeling behind on my syllabus",
    "How do I deal with exam anxiety?",
    "I keep comparing myself to others",
    "Help me make a quick study plan",
  ];

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold">AI Companion</h2>
          {recentEntry && (
            <Badge variant="outline" className="text-xs">
              {MOOD_CONFIG[recentEntry.mood]?.emoji} Mood context active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear conversation history"
          className="h-8 w-8 text-muted-foreground"
          disabled={messages.length === 0}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Crisis card */}
      {showCrisis && (
        <div className="p-4">
          <CrisisCard
            onDismiss={() => setShowCrisis(false)}
            variant="inline"
          />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        {messages.length === 0 ? (
          <div className="text-center space-y-4 py-8">
            <Bot className="h-10 w-10 text-violet-300 mx-auto" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              I&apos;m here to help you navigate exam stress. Ask me anything.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4" role="log" aria-label="Conversation" aria-live="polite">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm",
                  ].join(" ")}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      <span className="sr-only">Thinking…</span>
                      <span aria-hidden="true">…</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            maxLength={1000}
            className="resize-none text-sm flex-1"
            aria-label="Message to AI companion"
            disabled={isStreaming}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            size="icon"
            aria-label={isStreaming ? "Sending message" : "Send message"}
            className="h-[60px] w-10 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Not a substitute for professional mental health support.
        </p>
      </div>
    </div>
  );
}
