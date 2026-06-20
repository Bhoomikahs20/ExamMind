"use client";

/**
 * MindfulnessLibrary — Adaptive exercise selection
 * Recommends one exercise based on intensity_score, shows all as fallback.
 */

import { useState } from "react";
import dynamic from "next/dynamic";
import { Wind, Anchor, Hash, Zap, Activity, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EXERCISES, getRecommendedExercise } from "@/lib/exercises";
import type { ExerciseType } from "@/types";

const BoxBreathing = dynamic(() => import("@/components/exercises/BoxBreathing"), { ssr: false });
const Grounding = dynamic(() => import("@/components/exercises/Grounding"), { ssr: false });
const NameThree = dynamic(() => import("@/components/exercises/NameThree"), { ssr: false });
const PepTalk = dynamic(() => import("@/components/exercises/PepTalk"), { ssr: false });
const ProgressiveRelaxation = dynamic(() => import("@/components/exercises/ProgressiveRelaxation"), { ssr: false });
const MindfulPause = dynamic(() => import("@/components/exercises/MindfulPause"), { ssr: false });

const EXERCISE_ICONS: Record<ExerciseType, React.ElementType> = {
  box_breathing: Wind,
  grounding: Anchor,
  name_three: Hash,
  pep_talk: Zap,
  progressive_relaxation: Activity,
  mindful_pause: Pause,
};

function ExerciseContent({ id }: { id: ExerciseType }) {
  switch (id) {
    case "box_breathing": return <BoxBreathing />;
    case "grounding": return <Grounding />;
    case "name_three": return <NameThree />;
    case "pep_talk": return <PepTalk />;
    case "progressive_relaxation": return <ProgressiveRelaxation />;
    case "mindful_pause": return <MindfulPause />;
  }
}

interface MindfulnessLibraryProps {
  intensityScore?: number;
}

export default function MindfulnessLibrary({ intensityScore = 5 }: MindfulnessLibraryProps) {
  const recommended = getRecommendedExercise(intensityScore);
  const [active, setActive] = useState<ExerciseType>(recommended.id);
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="space-y-4">
      {/* Recommendation header */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p className="text-xs text-violet-600 font-medium uppercase tracking-wide mb-1">
          Recommended for you
        </p>
        <p className="text-sm text-violet-800">
          Based on your stress level today ({intensityScore}/10), we suggest{" "}
          <strong>{recommended.title}</strong> — {recommended.durationMin} min.
        </p>
      </div>

      {/* Active exercise */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {(() => {
                const Icon = EXERCISE_ICONS[active];
                return <Icon className="h-4 w-4 text-violet-500" aria-hidden="true" />;
              })()}
              {EXERCISES.find((e) => e.id === active)?.title}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {EXERCISES.find((e) => e.id === active)?.durationMin} min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ExerciseContent id={active} />
        </CardContent>
      </Card>

      {/* Exercise picker */}
      <div>
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          aria-controls="exercise-list"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Hide all exercises
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1.5" aria-hidden="true" />
              See all {EXERCISES.length} exercises
            </>
          )}
        </Button>

        {showAll && (
          <div
            id="exercise-list"
            className="grid grid-cols-2 gap-2 mt-2"
            role="list"
            aria-label="All exercises"
          >
            {EXERCISES.map((ex) => {
              const Icon = EXERCISE_ICONS[ex.id];
              const isActive = active === ex.id;
              return (
                <button
                  key={ex.id}
                  role="listitem"
                  onClick={() => setActive(ex.id)}
                  aria-pressed={isActive}
                  className={[
                    "text-left rounded-xl border p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400",
                    isActive
                      ? "bg-violet-100 border-violet-400"
                      : "bg-muted/50 border-border hover:border-violet-300",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 text-violet-500 mb-1.5" aria-hidden="true" />
                  <p className="text-xs font-medium leading-tight">{ex.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.durationMin} min</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}