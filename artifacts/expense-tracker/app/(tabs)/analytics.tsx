import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, getCategoryById } from "@/constants/categories";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";
import { PieChart } from "@/components/PieChart";

type Period = "weekly" | "monthly" | "yearly";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, totalIncome, totalExpenses, balance, thisMonthIncome, thisMonthExpenses } = useTransactions();
  const { goals } = useGoals();
  const { format, formatFull, info: currencyInfo } = useCurrency();
  const [period, setPeriod] = useState<Period>("monthly");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;
  const now = new Date();

  const barData = useMemo(() => {
    if (period === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const filt = (type: string) => transactions.filter((t) => {
          const td = new Date(t.date + "T12:00:00");
          return t.type === type && td.toDateString() === d.toDateString();
        }).reduce((s, t) => s + t.amount, 0);
        return { label: DAYS[d.getDay()], income: filt("income"), expense: filt("expense") };
      });
    }
    if (period === "monthly") {
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const filt = (type: string) => transactions.filter((t) => {
          const td = new Date(t.date + "T12:00:00");
          return t.type === type && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        }).reduce((s, t) => s + t.amount, 0);
        return { label: MONTHS[d.getMonth()], income: filt("income"), expense: filt("expense") };
      });
    }
    // yearly — 12 months of current year
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      const filt = (type: string) => transactions.filter((t) => {
        const td = new Date(t.date + "T12:00:00");
        return t.type === type && td.getMonth() === i && td.getFullYear() === now.getFullYear();
      }).reduce((s, t) => s + t.amount, 0);
      return { label: MONTHS[i].slice(0, 1), income: filt("income"), expense: filt("expense") };
    });
  }, [transactions, period]);

  const maxBar = Math.max(...barData.map((d) => Math.max(d.income, d.expense)), 1);

  const yearTotalIncome   = barData.reduce((s, d) => s + d.income, 0);
  const yearTotalExpenses = barData.reduce((s, d) => s + d.expense, 0);

  const pieData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => { byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount; });
    return Object.entries(byCategory)
      .map(([id, value]) => { const cat = getCategoryById(id); return { value, color: cat.color, label: cat.name }; })
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => { byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount; });
    return Object.entries(byCategory)
      .map(([id, amount]) => ({ id, amount, cat: getCategoryById(id) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [transactions]);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  function generateReport(type: "monthly" | "yearly") {
    const period = type === "monthly"
      ? `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
      : `Year ${now.getFullYear()}`;
    const inc  = type === "monthly" ? thisMonthIncome   : totalIncome;
    const exp  = type === "monthly" ? thisMonthExpenses : totalExpenses;
    const net  = inc - exp;
    const rate = inc > 0 ? ((inc - exp) / inc * 100) : 0;

    const topCatLines = topCategories.slice(0, 5)
      .map((c, i) => `  ${i + 1}. ${c.cat.name.padEnd(16)} ${formatFull(c.amount).padStart(12)}`)
      .join("\n");

    const monthlyBreakdown = type === "yearly"
      ? "\n\n📅 MONTHLY BREAKDOWN\n" +
        MONTHS.map((m, i) => {
          const md = new Date(now.getFullYear(), i, 1);
          const me = transactions.filter((t) => t.type === "expense" && new Date(t.date+"T12:00:00").getMonth() === i && new Date(t.date+"T12:00:00").getFullYear() === now.getFullYear()).reduce((s, t) => s + t.amount, 0);
          const mi = transactions.filter((t) => t.type === "income"  && new Date(t.date+"T12:00:00").getMonth() === i && new Date(t.date+"T12:00:00").getFullYear() === now.getFullYear()).reduce((s, t) => s + t.amount, 0);
          return `  ${m}: Income ${format(mi).padStart(10)}  |  Expense ${format(me).padStart(10)}`;
        }).join("\n")
      : "";

    const goalSummary = goals.length > 0
      ? "\n\n🏆 SAVINGS GOALS\n" +
        goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
          const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
          return `  ${g.name.padEnd(18)} ${bar} ${pct.toFixed(0).padStart(3)}%\n  ${format(g.savedAmount)} saved of ${format(g.targetAmount)}`;
        }).join("\n\n")
      : "";

    const report = `
╔══════════════════════════════════════╗
║      📊 SPENDWISE ${type.toUpperCase()} REPORT      ║
║      ${period.padEnd(22)} · ${currencyInfo.code}   ║
╚══════════════════════════════════════╝

👤 ${user?.username ?? "User"} · ${user?.email ?? ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Income        ${formatFull(inc).padStart(14)}
  Expenses      ${formatFull(exp).padStart(14)}
  Net Balance   ${formatFull(net).padStart(14)}
  Savings Rate  ${(Math.max(rate, 0).toFixed(1) + "%").padStart(13)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷 TOP EXPENSE CATEGORIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topCatLines || "  No expenses recorded"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 TRANSACTION COUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total transactions:  ${transactions.length}
  Income entries:      ${transactions.filter((t) => t.type === "income").length}
  Expense entries:     ${transactions.filter((t) => t.type === "expense").length}${monthlyBreakdown}${goalSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by SpendWise · ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`.trim();

    if (Platform.OS === "web") {
      Alert.alert(`${type === "monthly" ? "Monthly" : "Yearly"} Report`, report);
    } else {
      Share.share({ message: report, title: `SpendWise ${type === "monthly" ? "Monthly" : "Yearly"} Report` });
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Analytics</Text>
        <View style={styles.exportBtns}>
          <TouchableOpacity onPress={() => generateReport("monthly")} style={[styles.exportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="share-outline" size={14} color="#6C5CE7" />
            <Text style={[styles.exportText, { color: "#6C5CE7" }]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => generateReport("yearly")} style={[styles.exportBtn, { backgroundColor: "#6C5CE720", borderColor: "#6C5CE740" }]}>
            <Ionicons name="document-text-outline" size={14} color="#6C5CE7" />
            <Text style={[styles.exportText, { color: "#6C5CE7" }]}>Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Income", value: format(totalIncome), color: "#00B894", icon: "arrow-up-circle" },
          { label: "Expenses", value: format(totalExpenses), color: "#FF6B6B", icon: "arrow-down-circle" },
          { label: "Savings %", value: `${Math.max(savingsRate, 0).toFixed(0)}%`, color: "#74B9FF", icon: "trending-up" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
              <Ionicons name={s.icon as any} size={16} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* This Month Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{MONTHS[now.getMonth()]} {now.getFullYear()} · Monthly</Text>
        <View style={styles.monthRow}>
          {[
            { label: "Income", v: format(thisMonthIncome), color: "#00B894" },
            { label: "Expenses", v: format(thisMonthExpenses), color: "#FF6B6B" },
            { label: "Net", v: (thisMonthIncome - thisMonthExpenses >= 0 ? "+" : "") + format(thisMonthIncome - thisMonthExpenses), color: thisMonthIncome - thisMonthExpenses >= 0 ? "#00B894" : "#FF6B6B" },
          ].map((s) => (
            <View key={s.label} style={styles.monthItem}>
              <Text style={[styles.monthLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              <Text style={[styles.monthValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Period Toggle */}
      <View style={[styles.segment, { backgroundColor: colors.muted }]}>
        {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
          <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.segBtn, period === p && { overflow: "hidden" }]}>
            {period === p ? (
              <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.segGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.segTextActive}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.segTextInactive, { color: colors.mutedForeground }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {period === "weekly" ? "Last 7 Days" : period === "monthly" ? "Last 6 Months" : `${now.getFullYear()} by Month`}
        </Text>
        {period === "yearly" && (
          <View style={styles.yearSummaryRow}>
            <View style={styles.yearSummaryItem}>
              <Text style={[styles.yearSummaryLabel, { color: colors.mutedForeground }]}>Year Income</Text>
              <Text style={[styles.yearSummaryValue, { color: "#00B894" }]}>{format(yearTotalIncome)}</Text>
            </View>
            <View style={styles.yearSummaryItem}>
              <Text style={[styles.yearSummaryLabel, { color: colors.mutedForeground }]}>Year Expenses</Text>
              <Text style={[styles.yearSummaryValue, { color: "#FF6B6B" }]}>{format(yearTotalExpenses)}</Text>
            </View>
          </View>
        )}
        {barData.every((d) => d.income === 0 && d.expense === 0) ? (
          <View style={styles.chartEmpty}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data for this period</Text>
          </View>
        ) : (
          <>
            <View style={styles.barChart}>
              {barData.map((d, i) => (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.bars}>
                    <View style={[styles.bar, { height: Math.max((d.income / maxBar) * 110, d.income > 0 ? 4 : 0), backgroundColor: "#00B894" }]} />
                    <View style={[styles.bar, { height: Math.max((d.expense / maxBar) * 110, d.expense > 0 ? 4 : 0), backgroundColor: "#FF6B6B" }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.barLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#00B894" }]} /><Text style={[styles.legendText, { color: colors.mutedForeground }]}>Income</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} /><Text style={[styles.legendText, { color: colors.mutedForeground }]}>Expense</Text></View>
            </View>
          </>
        )}
      </View>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Expense Breakdown</Text>
          <View style={styles.pieWrap}>
            <PieChart data={pieData} size={200} centerLabel="Total" centerValue={format(totalExpenses)} />
          </View>
          <View style={{ gap: 8 }}>
            {pieData.map((d) => (
              <View key={d.label} style={styles.pieLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground, flex: 1 }]} numberOfLines={1}>{d.label}</Text>
                <Text style={[styles.legendText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{format(d.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending by Category</Text>
        {topCategories.length === 0 ? (
          <View style={styles.chartEmpty}>
            <Ionicons name="pie-chart-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No expenses recorded yet</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {topCategories.map((c) => {
              const pct = totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0;
              return (
                <View key={c.id}>
                  <View style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: c.cat.color }]} />
                    <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>{c.cat.name}</Text>
                    <Text style={[styles.catAmount, { color: "#FF6B6B" }]}>{format(c.amount)}</Text>
                    <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{pct.toFixed(0)}%</Text>
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

      {/* Goals Analytics */}
      {goals.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Goals Overview</Text>
          <View style={styles.goalsStatsRow}>
            {[
              { label: "Active", value: goals.filter((g) => g.savedAmount < g.targetAmount).length.toString(), color: "#6C5CE7" },
              { label: "Completed", value: goals.filter((g) => g.savedAmount >= g.targetAmount).length.toString(), color: "#00B894" },
              { label: "Total Saved", value: format(goals.reduce((s, g) => s + g.savedAmount, 0)), color: "#74B9FF" },
            ].map((s) => (
              <View key={s.label} style={[styles.goalStatItem, { borderColor: colors.border }]}>
                <Text style={[styles.goalStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.goalStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 10 }}>
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
              return (
                <View key={g.id}>
                  <View style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: g.color }]} />
                    <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>{g.name}</Text>
                    <Text style={[{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: g.color }]}>{pct.toFixed(0)}%</Text>
                  </View>
                  <View style={[styles.catBarBg, { backgroundColor: colors.muted }]}>
                    <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: g.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* All-time Summary */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>All-Time Summary</Text>
        <View style={styles.vsRow}>
          {[
            { label: "Income", v: formatFull(totalIncome), color: "#00B894" },
            { label: "Expense", v: formatFull(totalExpenses), color: "#FF6B6B" },
            { label: "Net", v: formatFull(balance), color: balance >= 0 ? "#00B894" : "#FF6B6B" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.vsItem}>
                <Text style={[styles.vsLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                <Text style={[styles.vsAmount, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.v}</Text>
              </View>
              {i < 2 && <View style={[styles.vsDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>
        {(totalIncome + totalExpenses) > 0 && (
          <View style={[styles.vsBar, { backgroundColor: "#FF6B6B33" }]}>
            <View style={[styles.vsBarFill, { width: `${(totalIncome / (totalIncome + totalExpenses)) * 100}%`, backgroundColor: "#00B894" }]} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  exportBtns: { flexDirection: "row", gap: 8 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  exportText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, alignItems: "flex-start", gap: 4 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold", width: "100%" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 14 },
  monthRow: { flexDirection: "row", gap: 4 },
  monthItem: { flex: 1, alignItems: "center", gap: 4 },
  monthLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  monthValue: { fontSize: 13, fontFamily: "Inter_700Bold", width: "100%", textAlign: "center" },
  segment: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, borderRadius: 10 },
  segGrad: { alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10 },
  segTextActive: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  segTextInactive: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", paddingVertical: 10 },
  yearSummaryRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  yearSummaryItem: { flex: 1, gap: 2 },
  yearSummaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  yearSummaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  barChart: { flexDirection: "row", alignItems: "flex-end", height: 130, gap: 2 },
  barGroup: { flex: 1, alignItems: "center", gap: 6 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 110 },
  bar: { width: 9, borderRadius: 4 },
  barLabel: { fontSize: 8, fontFamily: "Inter_400Regular" },
  barLegend: { flexDirection: "row", gap: 16, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pieWrap: { alignItems: "center", marginBottom: 16 },
  pieLegendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  catAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  catPct: { fontSize: 12, fontFamily: "Inter_400Regular", minWidth: 32, textAlign: "right" },
  catBarBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 3 },
  chartEmpty: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  goalsStatsRow: { flexDirection: "row", marginBottom: 16, borderRadius: 14, overflow: "hidden" },
  goalStatItem: { flex: 1, alignItems: "center", paddingVertical: 12, borderRightWidth: 1 },
  goalStatValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  goalStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  vsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  vsItem: { flex: 1, alignItems: "center" },
  vsLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  vsAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  vsDivider: { width: 1, height: 40 },
  vsBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  vsBarFill: { height: "100%", borderRadius: 4 },
});
