import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useCategoryBudgets } from "@/context/CategoryBudgetContext";
import { useAchievements } from "@/context/AchievementsContext";
import { useColors } from "@/hooks/useColors";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionCard } from "@/components/TransactionCard";
import { getCategoryById } from "@/constants/categories";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function computeHealthScore(savingsRate: number, budgetPercent: number, budgetSet: boolean, goalProgress: number, hasGoals: boolean, txCount: number): number {
  const savingsPts = Math.min((savingsRate / 20) * 40, 40);
  const budgetPts  = budgetSet ? Math.max(0, ((100 - budgetPercent) / 100) * 25) : 12;
  const goalPts    = hasGoals ? Math.min((goalProgress / 100) * 20, 20) : 10;
  const actPts     = Math.min((txCount / 30) * 15, 15);
  return Math.round(savingsPts + budgetPts + goalPts + actPts);
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { format } = useCurrency();
  const {
    transactions, totalIncome, totalExpenses, balance, savings, deleteTransaction,
    todayExpenses, thisMonthExpenses, budgetRemaining, budgetPercent,
  } = useTransactions();
  const { goals } = useGoals();
  const { overBudgetCategories, nearLimitCategories } = useCategoryBudgets();
  const { xp, level, levelTitle, earnedCount } = useAchievements();

  const recent = transactions.slice(0, 6);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const fabBottom = insets.bottom + (Platform.OS === "web" ? 84 : 90);
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";
  const previewGoals = goals.slice(0, 2);

  const budgetAlert =
    budgetPercent >= 100 ? "over" :
    budgetPercent >= 80  ? "danger" :
    budgetPercent >= 50  ? "warning" : null;

  const recurringDue = useMemo(() => {
    const recurring = transactions.filter((t) => t.recurring && t.recurring !== "none");
    const byCategory: Record<string, typeof transactions[0]> = {};
    recurring.forEach((t) => {
      const key = `${t.category}_${t.recurring}`;
      if (!byCategory[key] || t.date > byCategory[key].date) byCategory[key] = t;
    });
    const now = new Date();
    return Object.values(byCategory).filter((t) => {
      const last = new Date(t.date + "T12:00:00");
      const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
      if (t.recurring === "daily")   return diff >= 1;
      if (t.recurring === "weekly")  return diff >= 7;
      if (t.recurring === "monthly") return diff >= 28;
      return false;
    });
  }, [transactions]);

  const goalProgress = useMemo(() => {
    const total = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved = goals.reduce((s, g) => s + g.savedAmount, 0);
    return total > 0 ? (saved / total) * 100 : 0;
  }, [goals]);

  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const healthScore = useMemo(() =>
    computeHealthScore(savingsRate, budgetPercent, (user?.budgetLimit ?? 0) > 0, goalProgress, goals.length > 0, transactions.length),
    [savingsRate, budgetPercent, user?.budgetLimit, goalProgress, goals.length, transactions.length]
  );

  const healthColor =
    healthScore >= 80 ? "#00B894" :
    healthScore >= 60 ? "#74B9FF" :
    healthScore >= 40 ? "#FDCB6E" :
    "#FF6B6B";

  const healthLabel =
    healthScore >= 80 ? "Excellent" :
    healthScore >= 60 ? "Good" :
    healthScore >= 40 ? "Average" :
    "Needs Work";

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  function handleEdit(id: string) {
    router.push({ pathname: "/edit-transaction", params: { id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: topPad + 4, paddingBottom: fabBottom + 70 }]}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greet()} 👋</Text>
            <Text style={[styles.username, { color: colors.foreground }]}>{user?.username ?? "User"}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={[styles.avatar, { backgroundColor: user?.avatarColor ?? "#6C5CE7" }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Recurring Reminders */}
        {recurringDue.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/add-transaction")} activeOpacity={0.8}>
            <View style={[styles.reminderBanner, { backgroundColor: "#A29BFE18", borderColor: "#A29BFE40" }]}>
              <View style={[styles.reminderIcon, { backgroundColor: "#A29BFE20" }]}>
                <Ionicons name="refresh-circle" size={18} color="#A29BFE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderTitle, { color: "#A29BFE" }]}>
                  {recurringDue.length} recurring transaction{recurringDue.length > 1 ? "s" : ""} due
                </Text>
                <Text style={[styles.reminderSub, { color: colors.mutedForeground }]}>
                  {recurringDue.map((t) => getCategoryById(t.category).name).join(", ")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#A29BFE" />
            </View>
          </TouchableOpacity>
        )}

        {/* Category Budget Alerts */}
        {overBudgetCategories.length > 0 && (
          <View style={[styles.catAlertBanner, { backgroundColor: "#FF6B6B15", borderColor: "#FF6B6B40" }]}>
            <Ionicons name="warning" size={15} color="#FF6B6B" />
            <Text style={[styles.catAlertText, { color: "#FF6B6B" }]}>
              Category over budget: {overBudgetCategories.map((id) => getCategoryById(id).name).join(", ")}
            </Text>
          </View>
        )}
        {nearLimitCategories.length > 0 && overBudgetCategories.length === 0 && (
          <View style={[styles.catAlertBanner, { backgroundColor: "#FDCB6E15", borderColor: "#FDCB6E40" }]}>
            <Ionicons name="alert-circle" size={15} color="#FDCB6E" />
            <Text style={[styles.catAlertText, { color: "#FDCB6E" }]}>
              Near limit: {nearLimitCategories.map((id) => getCategoryById(id).name).join(", ")}
            </Text>
          </View>
        )}

        {/* Budget Alerts */}
        {budgetAlert === "over" && (
          <LinearGradient colors={["#FF6B6B", "#E17055"]} style={styles.alertBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="warning" size={18} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Monthly Budget Exceeded!</Text>
              <Text style={styles.alertSub}>Spent {format(thisMonthExpenses)} of {format(user?.budgetLimit ?? 0)}</Text>
            </View>
            <Text style={styles.alertPct}>{budgetPercent.toFixed(0)}%</Text>
          </LinearGradient>
        )}
        {budgetAlert === "danger" && (
          <LinearGradient colors={["#E17055", "#FDCB6E"]} style={styles.alertBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Nearing Budget Limit</Text>
              <Text style={styles.alertSub}>{format(budgetRemaining)} remaining from {format(user?.budgetLimit ?? 0)}</Text>
            </View>
            <Text style={styles.alertPct}>{budgetPercent.toFixed(0)}%</Text>
          </LinearGradient>
        )}
        {budgetAlert === "warning" && (
          <View style={[styles.alertSoftBanner, { backgroundColor: "#FDCB6E18", borderColor: "#FDCB6E40" }]}>
            <Ionicons name="information-circle" size={16} color="#FDCB6E" />
            <Text style={[styles.alertSoftText, { color: "#FDCB6E" }]}>
              50% of monthly budget used · {format(budgetRemaining)} left
            </Text>
          </View>
        )}

        {/* Smart Stats Row */}
        <View style={styles.smartRow}>
          {[
            { label: "Today",      value: format(todayExpenses),    color: "#FF6B6B", icon: "today",            bg: "#FF6B6B18" },
            { label: "This Month", value: format(thisMonthExpenses), color: "#6C5CE7", icon: "calendar",         bg: "#6C5CE718" },
            { label: "Budget Left",value: format(budgetRemaining),  color: "#00B894", icon: "shield-checkmark", bg: "#00B89418" },
          ].map((s) => (
            <View key={s.label} style={[styles.smartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.smartIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={14} color={s.color} />
              </View>
              <Text style={[styles.smartLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              <Text style={[styles.smartValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <SummaryCard title="Total Balance" amount={balance} variant="balance" />
        </View>

        {/* Income / Expense row */}
        <View style={styles.row}>
          <SummaryCard title="Income" amount={totalIncome} variant="income" compact />
          <SummaryCard title="Expenses" amount={totalExpenses} variant="expense" compact />
        </View>

        {/* Financial Health Score */}
        <TouchableOpacity onPress={() => router.push("/(tabs)/ai-coach")} activeOpacity={0.85}>
          <View style={[styles.healthCard, { backgroundColor: colors.card, borderColor: healthColor + "40" }]}>
            <View style={styles.healthLeft}>
              <View style={styles.healthTitleRow}>
                <View style={[styles.healthIconWrap, { backgroundColor: healthColor + "20" }]}>
                  <Ionicons name="heart" size={14} color={healthColor} />
                </View>
                <Text style={[styles.healthTitle, { color: colors.foreground }]}>Financial Health</Text>
                <View style={[styles.healthBadge, { backgroundColor: healthColor + "20" }]}>
                  <Text style={[styles.healthBadgeText, { color: healthColor }]}>{healthLabel}</Text>
                </View>
              </View>
              <View style={[styles.healthBarBg, { backgroundColor: colors.muted }]}>
                <LinearGradient
                  colors={[healthColor + "CC", healthColor]}
                  style={[styles.healthBarFill, { width: `${healthScore}%` }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[styles.healthHint, { color: colors.mutedForeground }]}>
                Tap for AI insights & recommendations
              </Text>
            </View>
            <View style={styles.healthRight}>
              <Text style={[styles.healthScore, { color: healthColor }]}>{healthScore}</Text>
              <Text style={[styles.healthMax, { color: colors.mutedForeground }]}>/100</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* XP / Level Strip */}
        {transactions.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
            <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.xpStrip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="star" size={14} color="#FDCB6E" />
              <Text style={styles.xpText}>Level {level} · {levelTitle}</Text>
              <View style={styles.xpSpacer} />
              <Text style={styles.xpBadgeCount}>{earnedCount} badges</Text>
              <Text style={styles.xpVal}>{xp} XP</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Budget Progress */}
        {user?.budgetLimit ? (
          <View style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.budgetHeader}>
              <View style={[styles.budgetIcon, { backgroundColor: "#FDCB6E22" }]}>
                <Ionicons name="shield" size={14} color="#FDCB6E" />
              </View>
              <Text style={[styles.budgetTitle, { color: colors.foreground }]}>Monthly Budget</Text>
              <Text style={[styles.budgetPct, { color: budgetPercent >= 100 ? "#FF6B6B" : budgetPercent >= 80 ? "#E17055" : "#00B894" }]}>
                {budgetPercent.toFixed(0)}% used
              </Text>
            </View>
            <View style={styles.budgetAmounts}>
              <Text style={[styles.budgetSpent, { color: "#FF6B6B" }]}>{format(thisMonthExpenses)} spent</Text>
              <Text style={[styles.budgetTotal, { color: colors.mutedForeground }]}>{format(user.budgetLimit)} limit</Text>
            </View>
            <View style={[styles.budgetBarBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.budgetBarFill, {
                width: `${budgetPercent}%`,
                backgroundColor: budgetPercent >= 100 ? "#FF6B6B" : budgetPercent >= 80 ? "#E17055" : budgetPercent >= 50 ? "#FDCB6E" : "#00B894",
              }]} />
            </View>
          </View>
        ) : null}

        {/* Savings Goals Preview */}
        {previewGoals.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Savings Goals</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/goals")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>Manage →</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10, marginBottom: 16 }}>
              {previewGoals.map((goal) => {
                const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
                return (
                  <TouchableOpacity key={goal.id} onPress={() => router.push("/(tabs)/goals")} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + "20" }]}>
                      <Ionicons name={goal.icon as any} size={18} color={goal.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.goalTop}>
                        <Text style={[styles.goalName, { color: colors.foreground }]} numberOfLines={1}>{goal.name}</Text>
                        <Text style={[styles.goalAmt, { color: goal.color }]}>{format(goal.savedAmount)} / {format(goal.targetAmount)}</Text>
                      </View>
                      <View style={[styles.goalBarBg, { backgroundColor: colors.muted }]}>
                        <View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: goal.color }]} />
                      </View>
                      <Text style={[styles.goalPct, { color: colors.mutedForeground }]}>{pct.toFixed(0)}% saved</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
          {transactions.length > 5 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <LinearGradient colors={["#6C5CE722", "#A29BFE22"]} style={styles.emptyIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="receipt-outline" size={32} color="#6C5CE7" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No transactions yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Tap + to add your first transaction</Text>
          </View>
        ) : (
          <View>{recent.map((t) => <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} onEdit={handleEdit} />)}</View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-transaction"); }} activeOpacity={0.85} style={[styles.fab, { bottom: fabBottom }]}>
        <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingTop: 4 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  username: { fontSize: 24, fontFamily: "Inter_700Bold" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  reminderBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  reminderIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  reminderSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  catAlertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  catAlertText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, marginBottom: 10 },
  alertTitle: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  alertSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  alertPct: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  alertSoftBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  alertSoftText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  smartRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  smartCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, gap: 4 },
  smartIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  smartLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  smartValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  balanceCard: { marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  healthCard: { borderRadius: 18, padding: 16, borderWidth: 1.5, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  healthLeft: { flex: 1, gap: 8 },
  healthTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  healthTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  healthBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  healthBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  healthBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  healthBarFill: { height: "100%", borderRadius: 3 },
  healthHint: { fontSize: 10, fontFamily: "Inter_400Regular" },
  healthRight: { alignItems: "center" },
  healthScore: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 36 },
  healthMax: { fontSize: 11, fontFamily: "Inter_400Regular" },
  xpStrip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, padding: 12, marginBottom: 12 },
  xpText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  xpSpacer: { flex: 1 },
  xpBadgeCount: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  xpVal: { color: "#FDCB6E", fontSize: 14, fontFamily: "Inter_700Bold" },
  budgetCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 16, gap: 8 },
  budgetHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  budgetTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  budgetPct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  budgetAmounts: { flexDirection: "row", justifyContent: "space-between" },
  budgetSpent: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  budgetTotal: { fontSize: 13, fontFamily: "Inter_400Regular" },
  budgetBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  budgetBarFill: { height: "100%", borderRadius: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, borderWidth: 1 },
  goalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  goalName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  goalAmt: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  goalBarBg: { height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  goalBarFill: { height: "100%", borderRadius: 3 },
  goalPct: { fontSize: 10, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", padding: 40, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  fab: { position: "absolute", right: 20, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  fabGrad: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
});
