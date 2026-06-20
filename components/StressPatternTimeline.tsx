"use client";

/**
 * StressPatternTimeline — Addition #1
 *
 * Cross-references mood intensity trend with detected stress_triggers over
 * the last 14 days and surfaces plain-language callouts.
 * Not a restatement of raw data — derived insights only.
 */

import { useMemo } from "react";
import { TrendingUp, RefreshCw, AlertTriangle, Battery } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deriveStressTimeline, type StressTimelineCallout } from "@/lib/mood-utils";
import type { CheckInEntry, AIAnalysis } from "@/types";

const ICONS: Record<StressTimelineCallout["type"], React.ElementType> = {
  rising_before_trigger: TrendingUp,
  recovery_after_high: RefreshCw,
  recurring_tag: AlertTriangle,
  sustained_low: Battery,
};

const COLORS: Record<StressTimelineCallout["type"], string> = {
  rising_before_trigger: "text-amber-600",
  recovery_after_high: "text-green-600",
  recurring_tag: "text-orange-600",
  sustained_low: "text-red-500",
};

const BG: Record<StressTimelineCallout["type"], string> = {
  rising_before_trigger: "bg-amber-50 border-amber-200",
  recovery_after_high: "bg-green-50 border-green-200",
  recurring_tag: "bg-orange-50 border-orange-200",
  sustained_low: "bg-red-50 border-red-200",
};

interface Props {
  entries: CheckInEntry[];
  analyses: AIAnalysis[];
}

export default function StressPatternTimeline({ entries, analyses }: Props) {
  const callouts = useMemo(
    () => deriveStressTimeline(entries, analyses),
    [entries, analyses]
  );

  if (entries.length < 3) return null;
  if (callouts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-500" aria-hidden="true" />
          Patterns over 14 days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {callouts.map((c, i) => {
          const Icon = ICONS[c.type];
          return (
            <div
              key={`${c.type}-${i}`}
              className={`rounded-xl border p-3 flex gap-2.5 items-start ${BG[c.type]}`}
              role="article"
              aria-label={`Pattern: ${c.type.replaceAll("_", " ")}`}
            >
              <Icon
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${COLORS[c.type]}`}
                aria-hidden="true"
              />
              <p className="text-sm leading-relaxed text-foreground">{c.message}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
