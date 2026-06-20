"use client";

/**
 * MoodChart — Line chart for mood over time
 * Uses recharts. Accessibility: keyboard navigable, proper aria labels.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { MOOD_CONFIG } from "@/lib/mood-utils";

interface MoodChartProps {
  data: { date: string; mood: number }[];
}

const MOOD_EMOJIS: Record<number, string> = {
  1: "😰",
  2: "😟",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const mood = payload[0].value as 1 | 2 | 3 | 4 | 5;
  const config = MOOD_CONFIG[mood] ?? MOOD_CONFIG[3];
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow text-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p style={{ color: config.color }} className="font-semibold">
        {MOOD_EMOJIS[mood]} {config.label} ({mood}/5)
      </p>
    </div>
  );
}

export default function MoodChart({ data }: MoodChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  // Build accessible table description for screen readers
  const srSummary = chartData
    .map((d) => `${d.displayDate}: ${MOOD_CONFIG[d.mood as 1 | 2 | 3 | 4 | 5]?.label ?? d.mood}`)
    .join(", ");

  return (
    <div>
      {/* Screen reader table */}
      <table className="sr-only" aria-label="Mood over time">
        <caption>Your mood ratings for the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Mood</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d, i) => (
            <tr key={`${d.date}-${i}`}>
              <td>{d.displayDate}</td>
              <td>
                {MOOD_CONFIG[d.mood as 1 | 2 | 3 | 4 | 5]?.label ?? d.mood} ({d.mood}/5)
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={3} stroke="#e2e8f0" strokeDasharray="4 2" />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "#7c3aed" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
