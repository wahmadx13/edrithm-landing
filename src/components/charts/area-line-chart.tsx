"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface AreaDataItem {
  value: number;
}

interface AreaLineChartProps {
  data: AreaDataItem[];
  dataKey: string;
  strokeColor?: string;
  fillColor?: string;
}

export function AreaLineChart({
  data,
  dataKey,
  strokeColor = "#FF7A00",
  fillColor,
}: AreaLineChartProps) {
  const finalFill = fillColor || strokeColor;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={3}
          fill={finalFill}
          fillOpacity={0.15}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
