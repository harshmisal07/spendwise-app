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

const FORMATS: Record<string, { label: string; emoji: string }> = {
  balance: { label: "Total Balance", emoji: "💳" },
  income: { label: "Total Income", emoji: "↑" },
  expense: { label: "Total Expenses", emoji: "↓" },
  savings: { label: "Savings", emoji: "🏦" },
};

export function SummaryCard({ title, amount, variant, compact = false }: Props) {
  const colors = useColors();
  const isDark = colors.background === "#0D0D1A";

  const gradients: Record<string, [string, string]> = {
    balance: [colors.gradientStart, colors.gradientEnd],
    income: ["#00B894", "#55EFC4"],
    expense: ["#FF6B6B", "#FD79A8"],
    savings: ["#0984E3", "#74B9FF"],
  };

  const gradient = gradients[variant];

  if (compact) {
    const color =
      variant === "income" ? colors.income : variant === "expense" ? colors.expense : colors.primary;
    return (
      <View style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.compactLabel, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.compactAmount, { color }]}>${Math.abs(amount).toFixed(2)}</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradient} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.amount}>${Math.abs(amount).toFixed(2)}</Text>
      <Text style={styles.subtitle}>{amount < 0 ? "In debt" : "Available"}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  compact: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  compactLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  compactAmount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
});
