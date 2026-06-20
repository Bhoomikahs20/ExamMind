"use client";

/**
 * TriggerChart — Bar chart for stress trigger frequency
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TAG_LABELS } from "@/lib/mood-utils";
import type { StressTag } from "@/types";

const COLORS = [
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
  "#ede9fe",
  "#f5f3ff",
];

interface TriggerChartProps {
  data: { tag: string; count: number }[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { tag: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const { tag } = payload[0].payload;
  const count = payload[0].value;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-medium">{TAG_LABELS[tag as StressTag] ?? tag}</p>
      <p className="text-muted-foreground text-xs">
        {count} {count === 1 ? "time" : "times"} this week
      </p>
    </div>
  );
}

export default function TriggerChart({ data }: TriggerChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: TAG_LABELS[d.tag as StressTag] ?? d.tag,
    shortLabel:
      (TAG_LABELS[d.tag as StressTag] ?? d.tag).split(" ").slice(0, 1).join(" "),
  }));

  return (
    <div>
      {/* Screen reader table */}
      <table className="sr-only" aria-label="Stress trigger frequency">
        <caption>How often each stress trigger appeared this week</caption>
        <thead>
          <tr>
            <th scope="col">Trigger</th>
            <th scope="col">Times this week</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.tag}>
              <td>{d.label}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={`cell-${d.tag}-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
