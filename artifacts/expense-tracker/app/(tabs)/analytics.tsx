import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, getCategoryById } from "@/constants/categories";
import { useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { PieChart } from "@/components/PieChart";

type Period = "weekly" | "monthly";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, totalExpenses } = useTransactions();
  const [period, setPeriod] = useState<Period>("monthly");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const now = new Date();

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      });
    return Object.entries(byCategory)
      .map(([id, value]) => {
        const cat = getCategoryById(id);
        return { value, color: cat.color, label: cat.name };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const barData = useMemo(() => {
    if (period === "monthly") {
      const months: { label: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = MONTHS[d.getMonth()];
        const income = transactions
          .filter((t) => {
            const td = new Date(t.date);
            return t.type === "income" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
          })
          .reduce((s, t) => s + t.amount, 0);
        const expense = transactions
          .filter((t) => {
            const td = new Date(t.date);
            return t.type === "expense" && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
          })
          .reduce((s, t) => s + t.amount, 0);
        months.push({ label, income, expense });
      }
      return months;
    } else {
      const days: { label: string; income: number; expense: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = DAYS[d.getDay()];
        const income = transactions
          .filter((t) => {
            const td = new Date(t.date);
            return t.type === "income" && td.toDateString() === d.toDateString();
          })
          .reduce((s, t) => s + t.amount, 0);
        const expense = transactions
          .filter((t) => {
            const td = new Date(t.date);
            return t.type === "expense" && td.toDateString() === d.toDateString();
          })
          .reduce((s, t) => s + t.amount, 0);
        days.push({ label, income, expense });
      }
      return days;
    }
  }, [transactions, period]);

  const maxBar = Math.max(...barData.map((d) => Math.max(d.income, d.expense)), 1);

  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      });
    return Object.entries(byCategory)
      .map(([id, amount]) => ({ id, amount, cat: getCategoryById(id) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Analytics</Text>

      {/* Segment */}
      <View style={[styles.segment, { backgroundColor: colors.muted }]}>
        {(["monthly", "weekly"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.segBtn, period === p && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }]}
          >
            <Text style={[styles.segText, { color: period === p ? colors.primary : colors.mutedForeground }]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {period === "monthly" ? "Last 6 Months" : "This Week"}
        </Text>
        {barData.every((d) => d.income === 0 && d.expense === 0) ? (
          <View style={styles.chartEmpty}>
            <Ionicons name="bar-chart-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
          </View>
        ) : (
          <View style={styles.barChart}>
            {barData.map((d, i) => (
              <View key={i} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: Math.max((d.income / maxBar) * 100, 2), backgroundColor: colors.income + "CC" }]} />
                  <View style={[styles.bar, { height: Math.max((d.expense / maxBar) * 100, 2), backgroundColor: colors.expense + "CC" }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.barLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Expense</Text>
          </View>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Expense Breakdown</Text>
        <View style={styles.pieWrap}>
          <PieChart
            data={pieData}
            size={200}
            centerLabel="Total"
            centerValue={`$${totalExpenses.toFixed(0)}`}
          />
        </View>
      </View>

      {/* Spending Summary */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending by Category</Text>
        {topCategories.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 }]}>
            No expenses recorded
          </Text>
        ) : (
          <View style={{ gap: 14 }}>
            {topCategories.map((c) => {
              const pct = totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0;
              return (
                <View key={c.id}>
                  <View style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: c.cat.color }]} />
                    <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>
                      {c.cat.name}
                    </Text>
                    <Text style={[styles.catAmount, { color: colors.expense }]}>
                      ${c.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.catPct, { color: colors.mutedForeground }]}>
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.catBarBg, { backgroundColor: colors.muted }]}>
                    <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: c.cat.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 16 },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  segText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 4 },
  barGroup: { flex: 1, alignItems: "center", gap: 4 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 100 },
  bar: { width: 10, borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },
  barLegend: { flexDirection: "row", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pieWrap: { alignItems: "center" },
  catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  catAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  catPct: { fontSize: 12, fontFamily: "Inter_400Regular", minWidth: 32, textAlign: "right" },
  catBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 3 },
  chartEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
