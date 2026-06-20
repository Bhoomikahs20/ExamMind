"use client";

/**
 * 5-4-3-2-1 Grounding Exercise
 */

import { useState } from "react";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STEPS = [
  { count: 5, sense: "see", prompt: "Name 5 things you can see right now", emoji: "👁️" },
  { count: 4, sense: "touch", prompt: "Name 4 things you can physically touch near you", emoji: "✋" },
  { count: 3, sense: "hear", prompt: "Name 3 sounds you can hear right now", emoji: "👂" },
  { count: 2, sense: "smell", prompt: "Name 2 things you can smell (or 2 things you like the smell of)", emoji: "👃" },
  { count: 1, sense: "taste", prompt: "Name 1 thing you can taste right now", emoji: "👅" },
];

export default function Grounding() {
  const [stepIndex, setStepIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-semibold">You're back.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You just made contact with five layers of the present moment. Your nervous system noticed. Well done.
        </p>
        <Button onClick={() => { setStepIndex(0); setInputs(Array(5).fill("")); setCompleted(false); }} variant="outline">
          Repeat
        </Button>
      </div>
    );
  }

  const step = STEPS[stepIndex];

  return (
    <div className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-semibold">5-4-3-2-1 Grounding</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Anchoring yourself to the present moment using your senses.
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={5} aria-label={`Step ${stepIndex + 1} of 5`}>
        {STEPS.map((s, i) => (
          <div
            key={s.sense}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < stepIndex
                ? "bg-green-400"
                : i === stepIndex
                ? "bg-violet-500"
                : "bg-muted"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-2xl mb-2" aria-hidden="true">{step.emoji}</p>
        <p className="font-medium text-violet-800">{step.prompt}</p>
        <p className="text-xs text-violet-600 mt-1">Take your time. There's no rush.</p>
      </div>

      <div>
        <label htmlFor={`grounding-input-${stepIndex}`} className="sr-only">
          Your response for {step.sense}
        </label>
        <Textarea
          id={`grounding-input-${stepIndex}`}
          placeholder={`What do you ${step.sense === "touch" ? "notice touching" : step.sense}?`}
          value={inputs[stepIndex]}
          onChange={(e) => {
            const next = [...inputs];
            next[stepIndex] = e.target.value;
            setInputs(next);
          }}
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <Button
        onClick={() => {
          if (stepIndex < STEPS.length - 1) {
            setStepIndex((i) => i + 1);
          } else {
            setCompleted(true);
          }
        }}
        className="w-full"
      >
        {stepIndex < STEPS.length - 1 ? (
          <>
            Next <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Complete
          </>
        )}
      </Button>
    </div>
  );
}
