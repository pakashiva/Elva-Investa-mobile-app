import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing } from '../theme/colors';

const CHART_HEIGHT = 150;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.screen * 2 - 32;

const POINTS_1Y = [
  { x: 0.0, y: 0.52 },
  { x: 0.22, y: 0.38 },
  { x: 0.42, y: 0.68 },
  { x: 0.58, y: 0.32 },
  { x: 0.78, y: 0.42 },
  { x: 1.0, y: 0.12 },
];

const POINTS_ALL = [
  { x: 0.0, y: 0.7 },
  { x: 0.2, y: 0.55 },
  { x: 0.4, y: 0.62 },
  { x: 0.55, y: 0.35 },
  { x: 0.75, y: 0.4 },
  { x: 1.0, y: 0.15 },
];

const DOT_INDEXES = [1, 3, 4, 5];

function toCoords(
  points: { x: number; y: number }[],
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
  range?: '1Y' | 'ALL';
};

export default function PerformanceChart({ range = '1Y' }: Props) {
  const points = range === 'ALL' ? POINTS_ALL : POINTS_1Y;
  const coords = toCoords(points, CHART_WIDTH, CHART_HEIGHT);
  const path = buildSmoothPath(coords);
  const lastIdx = coords.length - 1;

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
        {DOT_INDEXES.map((idx) => {
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
