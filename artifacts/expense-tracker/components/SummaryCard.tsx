import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  amount: number;
  variant: "balance" | "income" | "expense" | "savings";
  compact?: boolean;
};

const META: Record<string, { icon: string; iconColor: string }> = {
  income: { icon: "arrow-up-circle", iconColor: "#00B894" },
  expense: { icon: "arrow-down-circle", iconColor: "#FF6B6B" },
  savings: { icon: "trending-up", iconColor: "#74B9FF" },
  balance: { icon: "wallet", iconColor: "#fff" },
};

export function SummaryCard({ title, amount, variant, compact = false }: Props) {
  const colors = useColors();
  const meta = META[variant];

  if (compact) {
    const amtColor =
      variant === "income" ? "#00B894"
      : variant === "expense" ? "#FF6B6B"
      : variant === "savings" ? "#74B9FF"
      : colors.primary;
    return (
      <View style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.compactIcon, { backgroundColor: amtColor + "18" }]}>
          <Ionicons name={meta.icon as any} size={16} color={amtColor} />
        </View>
        <Text style={[styles.compactLabel, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.compactAmount, { color: amtColor }]}>
          ${Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#6C5CE7", "#A29BFE"]}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardTop}>
        <Text style={styles.label}>{title}</Text>
        <View style={styles.iconWrap}>
          <Ionicons name={meta.icon as any} size={22} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
      <Text style={styles.amount}>${Math.abs(amount).toFixed(2)}</Text>
      <Text style={styles.subtitle}>
        {amount < 0 ? "⚠ In debt" : "Available balance"}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  compact: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  compactLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  compactAmount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
});
