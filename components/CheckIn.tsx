"use client";

/**
 * Daily Check-in Component — ExamMind
 *
 * Mood slider/emoji (1-5) + free-text journal + optional stress tags.
 * Triggers AI analysis after submission (debounced, not on every keystroke).
 */

import { useState, useCallback, useTransition } from "react";
import { format } from "date-fns";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import CrisisCard from "@/components/CrisisCard";
import { saveEntry, saveAnalysis, getRecentEntries, getJournalSummary } from "@/lib/storage";
import { getMoodConfig, TAG_LABELS } from "@/lib/mood-utils";
import type { CheckInEntry, StressTag, MoodLevel, AIAnalysis } from "@/types";

const ALL_TAGS: StressTag[] = [
  "sleep",
  "syllabus_pressure",
  "comparison_anxiety",
  "family_expectations",
  "exam_fear",
  "burnout",
  "time_management",
];

interface CheckInProps {
  existingEntry?: CheckInEntry;
  onComplete?: (entry: CheckInEntry, analysis?: AIAnalysis) => void;
}

export default function CheckIn({ existingEntry, onComplete }: CheckInProps) {
  const [mood, setMood] = useState<MoodLevel>(
    (existingEntry?.mood as MoodLevel) ?? 3
  );
  const [journalText, setJournalText] = useState(
    existingEntry?.journalText ?? ""
  );
  const [selectedTags, setSelectedTags] = useState<StressTag[]>(
    existingEntry?.tags ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<"watch" | "alert">("watch");
  const [savedEntry, setSavedEntry] = useState<CheckInEntry | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moodConfig = getMoodConfig(mood);

  const toggleTag = useCallback((tag: StressTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!journalText.trim()) return;
    setError(null);

    startTransition(async () => {
      // 1. Save entry to localStorage
      const entry: CheckInEntry = {
        id: existingEntry?.id ?? crypto.randomUUID(),
        date: format(new Date(), "yyyy-MM-dd"),
        timestamp: Date.now(),
        mood,
        journalText: journalText.trim(),
        tags: selectedTags,
      };
      saveEntry(entry);
      setSavedEntry(entry);

      // 2. Request AI analysis
      setIsAnalyzing(true);
      try {
        const recentEntries = getRecentEntries(7);
        const rollingJournalSummary = getJournalSummary();
        const recentMoods = recentEntries.map((e) => e.mood);

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journalText: journalText.trim(),
            rollingSummary: rollingJournalSummary?.summary ?? "",
            recentMoods,
          }),
        });

        const data = await res.json();

        if (data.crisisDetected) {
          setCrisisLevel(data.level);
          setCrisisDetected(true);
          onComplete?.(entry);
          return;
        }

        if (!res.ok) {
          setError(data.error ?? "Analysis failed");
          onComplete?.(entry);
          return;
        }

        // 3. Save analysis with suggested tags merged into entry
        const newAnalysis: AIAnalysis = {
          id: crypto.randomUUID(),
          entryId: entry.id,
          date: entry.date,
          stress_triggers: data.stress_triggers ?? [],
          emotional_tone: data.emotional_tone ?? "neutral",
          intensity_score: data.intensity_score ?? 5,
          recurring_pattern: data.recurring_pattern ?? "",
          reflective_insight: data.reflective_insight ?? "",
          suggested_tags: data.suggested_tags ?? [],
          analyzed_at: Date.now(),
        };
        saveAnalysis(newAnalysis);

        // Merge suggested tags into entry
        const mergedTags = Array.from(
          new Set([...selectedTags, ...data.suggested_tags])
        ) as StressTag[];
        const updatedEntry: CheckInEntry = {
          ...entry,
          tags: mergedTags,
          analysisId: newAnalysis.id,
        };
        saveEntry(updatedEntry);

        setAnalysis(newAnalysis);
        onComplete?.(updatedEntry, newAnalysis);
      } catch (err) {
        console.error("Analysis error:", err);
        setError("Couldn't connect to AI analysis. Your entry was saved.");
        onComplete?.(entry);
      } finally {
        setIsAnalyzing(false);
      }
    });
  }, [mood, journalText, selectedTags, existingEntry, onComplete]);

  if (crisisDetected) {
    return (
      <div className="space-y-4">
        <CrisisCard
          onDismiss={() => {
            setCrisisDetected(false);
            if (savedEntry) onComplete?.(savedEntry);
          }}
        />
      </div>
    );
  }

  if (savedEntry && analysis && !isAnalyzing) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-green-900">Check-in saved!</h2>
          <p className="text-sm text-green-700">{analysis.reflective_insight}</p>
          <p className="text-xs text-green-600">
            Intensity: {analysis.intensity_score}/10 · Tone: {analysis.emotional_tone}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-violet-500" aria-hidden="true" />
          <span>Today&apos;s Check-in</span>
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {format(new Date(), "EEEE, MMM d")}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mood Selector */}
        <fieldset>
          <legend className="text-sm font-medium mb-3">
            How are you feeling right now?
          </legend>
          <div
            className="flex items-center gap-4 mb-2"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: moodConfig.bgColor,
              transition: "background-color 0.3s ease",
            }}
          >
            <span
              className="text-3xl"
              role="img"
              aria-label={`Mood: ${moodConfig.label}`}
            >
              {moodConfig.emoji}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: moodConfig.color }}>
                {moodConfig.label}
              </p>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[mood]}
                onValueChange={(val) => setMood((Array.isArray(val) ? val[0] : val) as MoodLevel)}
                className="mt-1"
                aria-label="Mood level"
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={mood}
                aria-valuetext={moodConfig.label}
              />
            </div>
          </div>
          {/* Screen-reader accessible mood labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1" aria-hidden="true">
            <span>😰 Overwhelmed</span>
            <span>😄 Energized</span>
          </div>
        </fieldset>

        {/* Journal Entry */}
        <div>
          <label
            htmlFor="journal-text"
            className="text-sm font-medium block mb-2"
          >
            What&apos;s on your mind?{" "}
            <span className="text-muted-foreground font-normal">
              (be as specific or brief as you want)
            </span>
          </label>
          <Textarea
            id="journal-text"
            placeholder="Today's mock went better than expected, but I'm still behind on Organic Chemistry. Feeling anxious about..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            rows={4}
            maxLength={2000}
            className="resize-none text-sm"
            aria-describedby="journal-hint"
          />
          <p id="journal-hint" className="text-xs text-muted-foreground mt-1 text-right">
            {journalText.length}/2000
          </p>
        </div>

        {/* Stress Tags */}
        <div>
          <p className="text-sm font-medium mb-2">
            Quick tags{" "}
            <span className="text-muted-foreground font-normal">(optional — AI will also suggest)</span>
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Stress tags">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1",
                  selectedTags.includes(tag)
                    ? "bg-violet-100 border-violet-400 text-violet-800"
                    : "bg-muted border-border text-muted-foreground hover:border-violet-300 hover:text-violet-700",
                ].join(" ")}
              >
                {TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!journalText.trim() || isPending || isAnalyzing}
          className="w-full"
          aria-busy={isPending || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Analyzing your entry…
            </>
          ) : isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Save Check-in
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
