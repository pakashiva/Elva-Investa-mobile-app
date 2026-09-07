import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { ChartPoint } from '../services/performanceService';
import { colors, spacing } from '../theme/colors';

const CHART_HEIGHT = 150;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.screen * 2 - 32;

const FALLBACK_POINTS: ChartPoint[] = [
  { x: 0, y: 0.55 },
  { x: 0.35, y: 0.55 },
  { x: 0.7, y: 0.55 },
  { x: 1, y: 0.55 },
];

function toCoords(
  points: ChartPoint[],
  width: number,
  height: number,
  padY = 16
) {
  return points.map((p) => ({
    x: p.x * width,
    y: padY + p.y * (height - padY * 2),
  }));
}

function buildSmoothPath(coords: { x: number; y: number }[]) {
  if (coords.length < 2) return '';
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? i : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

type Props = {
  points?: ChartPoint[];
};

export default function PerformanceChart({ points }: Props) {
  const series =
    points && points.length >= 2 ? points : FALLBACK_POINTS;
  const coords = toCoords(series, CHART_WIDTH, CHART_HEIGHT);
  const path = buildSmoothPath(coords);
  const lastIdx = coords.length - 1;
  const dotIndexes =
    coords.length <= 4
      ? coords.map((_, i) => i)
      : [1, Math.floor(coords.length / 2), coords.length - 2, lastIdx].filter(
          (v, i, arr) => arr.indexOf(v) === i && v >= 0
        );

  return (
    <View style={styles.wrap}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line
          x1={0}
          y1={CHART_HEIGHT * 0.38}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT * 0.38}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Line
          x1={0}
          y1={CHART_HEIGHT * 0.72}
          x2={CHART_WIDTH}
          y2={CHART_HEIGHT * 0.72}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Path
          d={path}
          stroke={colors.primarySoft}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dotIndexes.map((idx) => {
          const c = coords[idx];
          if (!c) return null;
          const isLast = idx === lastIdx;
          return (
            <React.Fragment key={idx}>
              {isLast && (
                <Circle
                  cx={c.x}
                  cy={c.y}
                  r={11}
                  fill={colors.primarySoft}
                  opacity={0.2}
                />
              )}
              <Circle
                cx={c.x}
                cy={c.y}
                r={isLast ? 5.5 : 4}
                fill="#FFFFFF"
                stroke={colors.primarySoft}
                strokeWidth={2.5}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  },
});
