"use client";

/**
 * Box Breathing Exercise
 * Animated breathing timer: inhale 4s → hold 4s → exhale 4s → hold 4s
 * Respects prefers-reduced-motion: shows text timer instead of animation.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Phase = "inhale" | "hold1" | "exhale" | "hold2";

const PHASES: { phase: Phase; label: string; duration: number; instruction: string }[] = [
  { phase: "inhale", label: "Breathe In", duration: 4, instruction: "Slowly breathe in through your nose" },
  { phase: "hold1", label: "Hold", duration: 4, instruction: "Hold your breath gently" },
  { phase: "exhale", label: "Breathe Out", duration: 4, instruction: "Slowly exhale through your mouth" },
  { phase: "hold2", label: "Hold", duration: 4, instruction: "Rest before the next breath" },
];

const PHASE_COLORS: Record<Phase, string> = {
  inhale: "#8b5cf6",
  hold1: "#6366f1",
  exhale: "#3b82f6",
  hold2: "#0ea5e9",
};

export default function BoxBreathing() {
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const currentDuration = PHASES[phaseIndex].duration;
        if (prev + 1 >= currentDuration) {
          setPhaseIndex((pi) => {
            const next = (pi + 1) % PHASES.length;
            if (next === 0) setCycles((c) => c + 1);
            return next;
          });
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phaseIndex]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhaseIndex(0);
    setElapsed(0);
    setCycles(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const currentPhase = PHASES[phaseIndex];
  const progress = (elapsed / currentPhase.duration) * 100;
  const color = PHASE_COLORS[currentPhase.phase];

  // Box size animation (skip if reduced motion)
  const boxScale = prefersReduced
    ? 1
    : currentPhase.phase === "inhale"
    ? 1 + (elapsed / currentPhase.duration) * 0.3
    : currentPhase.phase === "exhale"
    ? 1.3 - (elapsed / currentPhase.duration) * 0.3
    : currentPhase.phase === "hold1"
    ? 1.3
    : 1;

  return (
    <div className="text-center space-y-6 py-4">
      <div>
        <h3 className="text-lg font-semibold">Box Breathing</h3>
        <p
          className="text-sm text-muted-foreground mt-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {isRunning ? currentPhase.instruction : "Start when you're ready. Breathe at a comfortable pace."}
        </p>
      </div>

      {/* Visual box / timer */}
      <div className="flex items-center justify-center">
        <div
          className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center shadow-md"
          style={{
            backgroundColor: `${color}20`,
            border: `3px solid ${color}`,
            transform: prefersReduced ? "none" : `scale(${boxScale})`,
            transition: prefersReduced ? "none" : "transform 1s ease-in-out, background-color 1s ease",
          }}
          role="img"
          aria-label={`${currentPhase.label}: ${elapsed + 1} of ${currentPhase.duration} seconds`}
        >
          <p
            className="text-3xl font-bold tabular-nums"
            style={{ color }}
            aria-live="polite"
            aria-atomic="true"
          >
            {currentPhase.duration - elapsed}
          </p>
          <p className="text-sm font-medium mt-1" style={{ color }}>
            {currentPhase.label}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mx-auto max-w-xs space-y-2">
        <Progress
          value={progress}
          className="h-2"
          aria-label={`Phase progress: ${Math.round(progress)}%`}
        />
        <p className="text-xs text-muted-foreground">
          Cycle {cycles + 1} · Phase {phaseIndex + 1}/4
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => setIsRunning((r) => !r)}
          variant={isRunning ? "outline" : "default"}
          className="min-w-[100px]"
          aria-label={isRunning ? "Pause breathing exercise" : "Start breathing exercise"}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {cycles > 0 || elapsed > 0 ? "Resume" : "Start"}
            </>
          )}
        </Button>
        <Button
          onClick={reset}
          variant="ghost"
          aria-label="Reset breathing exercise"
        >
          <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {cycles >= 4 && (
        <p className="text-sm text-green-600 font-medium" role="status" aria-live="polite">
          Great job — 4 cycles complete! 🎉
        </p>
      )}
    </div>
  );
}
