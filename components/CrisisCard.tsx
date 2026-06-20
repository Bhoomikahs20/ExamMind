/**
 * CrisisCard — ExamMind Safety Layer
 *
 * Shown when crisis keywords are detected in journal/chat input.
 * Design principles:
 *  - Calm and non-alarming tone (no sirens, no dramatic red alerts)
 *  - Verified Indian helplines only
 *  - Encourages reaching out to a trusted adult — does NOT promise AI help
 *  - Does NOT diagnose or label the user
 */

import { Phone, Heart, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CrisisCardProps {
  onDismiss?: () => void;
  variant?: "inline" | "overlay";
}

export default function CrisisCard({
  onDismiss,
  variant = "inline",
}: CrisisCardProps) {
  const helplines = [
    {
      name: "Tele-MANAS",
      number: "14416",
      alt: "1-800-891-4416",
      hours: "24/7 · All states · Multilingual",
    },
    {
      name: "KIRAN Mental Health Helpline",
      number: "1800-599-0019",
      alt: null,
      hours: "24/7 · Free call",
    },
  ];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={variant === "overlay" ? "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" : ""}
    >
      <Card className="w-full max-w-md border-amber-200 bg-amber-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Heart
                className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold text-amber-900">
                We noticed you might be having a hard time
              </h2>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-7 w-7 text-amber-700 hover:text-amber-900 hover:bg-amber-100 flex-shrink-0"
                aria-label="Dismiss this message"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>

          <p className="mt-3 text-sm text-amber-800 leading-relaxed">
            Exam pressure can be genuinely overwhelming. What you&apos;re feeling is
            real and valid — and you don&apos;t have to carry it alone. Please consider
            reaching out to a trusted adult, teacher, or counselor.
          </p>

          <p className="mt-2 text-sm text-amber-800 leading-relaxed">
            These helplines are free, confidential, and available right now:
          </p>

          <div className="mt-4 space-y-3">
            {helplines.map((line) => (
              <div
                key={line.name}
                className="rounded-lg bg-white border border-amber-200 p-3"
              >
                <div className="flex items-center gap-2">
                  <Phone
                    className="h-4 w-4 text-amber-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-amber-900">
                    {line.name}
                  </span>
                </div>
                <div className="mt-1 ml-6">
                  <a
                    href={`tel:${line.number}`}
                    className="text-base font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
                  >
                    {line.number}
                  </a>
                  {line.alt && (
                    <span className="text-sm text-amber-700"> or {line.alt}</span>
                  )}
                  <p className="text-xs text-amber-600 mt-0.5">{line.hours}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-amber-700">
            ExamMind is a wellness companion, not a crisis service. For urgent
            support, please use the helplines above or speak to someone you trust.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
