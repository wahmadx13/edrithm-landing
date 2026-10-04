"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface VelocityDataItem {
  x: number;
  y: number;
}

interface VelocityChartProps {
  data: VelocityDataItem[];
  stableStrokeColor?: string;
  zigzagStrokeColor?: string;
  bottleneckColorDark?: string;
  bottleneckColorLight?: string;
}

export function VelocityChart({
  data,
  zigzagStrokeColor = "#FF3B3B",
  bottleneckColorDark = "#FFD600",
  bottleneckColorLight = "#FF7A00",
}: VelocityChartProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !data || data.length === 0) {
    return <div className="h-60 w-full" />;
  }

  const isDark = theme === "dark";
  const bottleneckIndex = Math.min(10, data.length - 1);
  const bottleneckPoint = data[bottleneckIndex];
  const finalBottleneckColor = isDark ? bottleneckColorDark : bottleneckColorLight;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
        <XAxis dataKey="x" hide />
        <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />

        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <Line
          type="linear"
          dataKey="y"
          stroke={zigzagStrokeColor}
          strokeWidth={3}
          dot={(props: {
            cx?: number;
            cy?: number;
            payload?: VelocityDataItem;
            index?: number;
          }) => {
            const { cx, cy, payload, index } = props;
            if (
              payload &&
              typeof cx === "number" &&
              typeof cy === "number" &&
              bottleneckPoint &&
              payload.x === bottleneckPoint.x
            ) {
              return (
                <g key="bottleneck-indicator">
                  <circle cx={cx} cy={cy} r={6} fill={finalBottleneckColor} filter="url(#glow)" />
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fill={finalBottleneckColor}
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: "bold",
                      letterSpacing: "0.05em",
                    }}
                    className="uppercase"
                  >
                    Bottleneck Point
                  </text>
                </g>
              );
            }
            return <g key={`dot-${index}`} />;
          }}
          animationDuration={2000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
