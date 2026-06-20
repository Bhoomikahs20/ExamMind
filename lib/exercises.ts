/**
 * Mindfulness exercise definitions — ExamMind
 */

import type { Exercise, ExerciseType } from "@/types";

export const EXERCISES: Exercise[] = [
  {
    id: "box_breathing",
    title: "Box Breathing",
    description: "A Navy SEAL technique: inhale 4 counts, hold 4, exhale 4, hold 4. Activates your calm response fast.",
    durationMin: 2,
    recommendedFor: { minIntensity: 6, maxIntensity: 10 },
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 Grounding",
    description: "Anchor yourself in the present moment using your five senses. Works well when anxiety is pulling you into the future.",
    durationMin: 3,
    recommendedFor: { minIntensity: 5, maxIntensity: 9 },
  },
  {
    id: "name_three",
    title: "Name 3 Things",
    description: "A quick cognitive reset: name 3 things you can see, 3 you're grateful for, 3 small wins from today.",
    durationMin: 2,
    recommendedFor: { minIntensity: 3, maxIntensity: 7 },
  },
  {
    id: "pep_talk",
    title: "Pre-Exam Pep Talk",
    description: "A personalized confidence boost generated from your own recent wins and progress. Because you have evidence.",
    durationMin: 1,
    recommendedFor: { minIntensity: 5, maxIntensity: 10 },
  },
  {
    id: "progressive_relaxation",
    title: "Progressive Relaxation",
    description: "Systematically tense and release muscle groups to release physical stress from hours of studying.",
    durationMin: 5,
    recommendedFor: { minIntensity: 4, maxIntensity: 8 },
  },
  {
    id: "mindful_pause",
    title: "Mindful Pause",
    description: "Just breathe and observe for 90 seconds. No goals, no productivity. Your brain needs white space.",
    durationMin: 2,
    recommendedFor: { minIntensity: 1, maxIntensity: 5 },
  },
];

export function getRecommendedExercise(intensityScore: number): Exercise {
  const candidates = EXERCISES.filter(
    (ex) =>
      intensityScore >= ex.recommendedFor.minIntensity &&
      intensityScore <= ex.recommendedFor.maxIntensity
  );
  if (candidates.length === 0) return EXERCISES[0];
  // Return the best-fit (closest midpoint match)
  return candidates.reduce((best, curr) => {
    const bestMid = (best.recommendedFor.minIntensity + best.recommendedFor.maxIntensity) / 2;
    const currMid = (curr.recommendedFor.minIntensity + curr.recommendedFor.maxIntensity) / 2;
    return Math.abs(currMid - intensityScore) < Math.abs(bestMid - intensityScore) ? curr : best;
  });
}

export function getExercise(id: ExerciseType): Exercise | undefined {
  return EXERCISES.find((ex) => ex.id === id);
}
