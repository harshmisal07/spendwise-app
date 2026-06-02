import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

type Slice = {
  value: number;
  color: string;
  label: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

type Props = {
  data: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
};

export function PieChart({ data, size = 200, centerLabel, centerValue }: Props) {
  const colors = useColors();
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0 || data.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: colors.border }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data</Text>
      </View>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r * 0.52;

  let startAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const s = { ...d, startAngle, endAngle };
    startAngle = endAngle;
    return s;
  });

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size}>
          <G>
            {slices.map((s, i) => (
              <Path key={i} d={arcPath(cx, cy, r, s.startAngle, s.endAngle)} fill={s.color} />
            ))}
            <Circle cx={cx} cy={cy} r={innerR} fill={colors.background} />
          </G>
        </Svg>
        {(centerLabel || centerValue) && (
          <View style={[styles.center, { width: innerR * 2 - 8, height: innerR * 2 - 8 }]}>
            {centerValue && (
              <Text style={[styles.centerValue, { color: colors.foreground }]} numberOfLines={1}>
                {centerValue}
              </Text>
            )}
            {centerLabel && (
              <Text style={[styles.centerLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                {centerLabel}
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.foreground }]}>
              {((s.value / total) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  svgWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  centerLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  legend: {
    width: "100%",
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  legendValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
