"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STEPS = [
  { emoji: "👣", title: "Feel your feet", instruction: "Press both feet flat on the floor. Notice the pressure, temperature, texture. Stay here for 5 breaths." },
  { emoji: "💪", title: "Tense and release: hands", instruction: "Make tight fists for 5 seconds. Then release completely. Notice the difference." },
  { emoji: "🦵", title: "Tense and release: legs", instruction: "Tighten your thigh muscles for 5 seconds. Release. Let your legs feel heavy." },
  { emoji: "🫁", title: "Tense and release: core", instruction: "Take a deep breath and hold it for 5 seconds while gently bracing your abs. Release slowly." },
  { emoji: "🤷", title: "Shoulder shrug", instruction: "Raise your shoulders up to your ears, hold for 5 seconds. Drop them. Repeat 3 times." },
  { emoji: "😮‍💨", title: "Final breath", instruction: "Take the deepest breath you have taken all day. Hold 3 seconds. Let it all go." },
];

export default function ProgressiveRelaxation() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Well done.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Physical tension and mental tension go hand in hand. You just broke the cycle.
        </p>
        <Button onClick={() => { setStep(0); setDone(false); }} variant="outline">
          <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
          Repeat
        </Button>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-semibold">Progressive Relaxation</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tense and release muscle groups to discharge physical stress.
        </p>
      </div>
      <Progress
        value={((step) / STEPS.length) * 100}
        className="h-2"
        aria-label={`Step ${step + 1} of ${STEPS.length}`}
      />
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
        <p className="text-4xl mb-3" aria-hidden="true">{current.emoji}</p>
        <p className="font-semibold text-indigo-800 mb-2">{current.title}</p>
        <p className="text-sm text-indigo-700 leading-relaxed">{current.instruction}</p>
      </div>
      <div className="flex gap-3">
        {step > 0 && (
          <Button onClick={() => setStep((s) => s - 1)} variant="outline" className="flex-1">
            Back
          </Button>
        )}
        <Button
          onClick={() => {
            if (step < STEPS.length - 1) setStep((s) => s + 1);
            else setDone(true);
          }}
          className="flex-1"
        >
          {step < STEPS.length - 1 ? "Done, next" : "Complete"}
        </Button>
      </div>
    </div>
  );
}