"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  {
    id: "see",
    title: "3 things you can see",
    prompt: "Look around right now",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-800",
  },
  {
    id: "grateful",
    title: "3 things you're grateful for",
    prompt: "Small ones count",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-800",
  },
  {
    id: "wins",
    title: "3 small wins from today",
    prompt: "Anything positive, big or tiny",
    color: "bg-amber-50 border-amber-200",
    textColor: "text-amber-800",
  },
];

export default function NameThree() {
  const [values, setValues] = useState<Record<string, string[]>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, ["", "", ""]]))
  );
  const [submitted, setSubmitted] = useState(false);

  const update = (catId: string, idx: number, val: string) => {
    setValues((prev) => {
      const next = { ...prev, [catId]: [...prev[catId]] };
      next[catId][idx] = val;
      return next;
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Nine good things.</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You just generated a cognitive anchor. Your brain will hold onto those wins whether you want it to or not.
        </p>
        <Button onClick={() => { setValues(Object.fromEntries(CATEGORIES.map((c) => [c.id, ["", "", ""]]))); setSubmitted(false); }} variant="outline">
          Do it again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      <div>
        <h3 className="text-lg font-semibold">Name 3 Things</h3>
        <p className="text-sm text-muted-foreground mt-1">
          A quick cognitive reset. No pressure, just notice.
        </p>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.id} className={`rounded-xl border p-4 ${cat.color}`}>
          <p className={`font-medium text-sm mb-0.5 ${cat.textColor}`}>{cat.title}</p>
          <p className="text-xs text-muted-foreground mb-3">{cat.prompt}</p>
          <div className="space-y-2">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 flex-shrink-0" aria-hidden="true">
                  {idx + 1}.
                </span>
                <Label htmlFor={`${cat.id}-${idx}`} className="sr-only">
                  {cat.title} — item {idx + 1}
                </Label>
                <Input
                  id={`${cat.id}-${idx}`}
                  value={values[cat.id][idx]}
                  onChange={(e) => update(cat.id, idx, e.target.value)}
                  className="h-8 text-sm bg-white/70"
                  placeholder=""
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={() => setSubmitted(true)} className="w-full">
        <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
        Done
      </Button>
    </div>
  );
}
