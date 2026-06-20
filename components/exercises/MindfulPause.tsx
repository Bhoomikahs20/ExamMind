"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DURATION = 90;

export default function MindfulPause() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= DURATION) {
          setRunning(false);
          setDone(true);
          return DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const remaining = DURATION - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="text-center space-y-5 py-4">
      <div>
        <h3 className="text-lg font-semibold">Mindful Pause</h3>
        <p className="text-sm text-muted-foreground mt-1">
          90 seconds. No goals. Just breathe and let your mind rest.
        </p>
      </div>
      <div
        className="w-36 h-36 rounded-full border-4 border-sky-300 bg-sky-50 flex flex-col items-center justify-center mx-auto"
        role="timer"
        aria-label={`${mins}:${secs.toString().padStart(2, "0")} remaining`}
      >
        <p className="text-3xl font-bold tabular-nums text-sky-700" aria-live="off">
          {mins}:{secs.toString().padStart(2, "0")}
        </p>
        <p className="text-xs text-sky-500 mt-0.5">remaining</p>
      </div>
      <Progress value={(elapsed / DURATION) * 100} className="max-w-xs mx-auto h-2" />
      {done ? (
        <p className="text-sm text-green-600 font-medium" role="status">
          Beautiful. Your mind just got a little white space.
        </p>
      ) : (
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setRunning((r) => !r)} variant={running ? "outline" : "default"}>
            {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
          </Button>
          <Button onClick={() => { setRunning(false); setElapsed(0); setDone(false); }} variant="ghost" aria-label="Reset">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}