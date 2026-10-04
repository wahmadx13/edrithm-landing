"use client";

import { Bar, BarChart as RechartsBar, Rectangle, ResponsiveContainer } from "recharts";

interface BarDataItem {
  value: number;
}

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  fill?: string;
  highlightIndex?: number;
  isDark?: boolean;
  highlightColorLight?: string;
  highlightColorDark?: string;
  defaultColorLight?: string;
  defaultColorDark?: string;
}

const CustomBar = (props: CustomBarProps) => {
  const {
    index,
    highlightIndex,
    isDark,
    highlightColorLight,
    highlightColorDark,
    defaultColorLight,
    defaultColorDark,
  } = props;

  const barFill =
    index === highlightIndex
      ? isDark
        ? highlightColorDark
        : highlightColorLight
      : isDark
        ? defaultColorDark
        : defaultColorLight;

  return <Rectangle {...props} fill={barFill} radius={[4, 4, 0, 0]} />;
};

interface BarChartProps {
  data: BarDataItem[];
  dataKey: string;
  highlightIndex?: number;
  highlightColorLight?: string;
  highlightColorDark?: string;
  defaultColorLight?: string;
  defaultColorDark?: string;
  isDark?: boolean;
}

export function BarChart({
  data,
  dataKey,
  highlightIndex,
  highlightColorLight = "#FF7A00",
  highlightColorDark = "#FF7A00",
  defaultColorLight = "#f1f5f9",
  defaultColorDark = "rgba(255,255,255,0.1)",
  isDark = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBar data={data}>
        <Bar
          dataKey={dataKey}
          shape={
            <CustomBar
              highlightIndex={highlightIndex}
              isDark={isDark}
              highlightColorLight={highlightColorLight}
              highlightColorDark={highlightColorDark}
              defaultColorLight={defaultColorLight}
              defaultColorDark={defaultColorDark}
            />
          }
        />
      </RechartsBar>
    </ResponsiveContainer>
  );
}
