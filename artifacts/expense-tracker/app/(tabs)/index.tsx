import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useColors } from "@/hooks/useColors";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionCard } from "@/components/TransactionCard";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    transactions, totalIncome, totalExpenses, balance, savings, deleteTransaction,
    todayExpenses, thisMonthIncome, thisMonthExpenses, budgetRemaining, budgetPercent,
  } = useTransactions();
  const { goals } = useGoals();

  const recent = transactions.slice(0, 6);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const fabBottom = insets.bottom + (Platform.OS === "web" ? 84 : 90);
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";
  const previewGoals = goals.slice(0, 2);

  const budgetAlert =
    budgetPercent >= 100 ? "over" :
    budgetPercent >= 80 ? "danger" :
    budgetPercent >= 50 ? "warning" : null;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 4, paddingBottom: fabBottom + 70 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greet()} 👋</Text>
            <Text style={[styles.username, { color: colors.foreground }]}>{user?.username ?? "User"}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatar, { backgroundColor: user?.avatarColor ?? "#6C5CE7" }]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Alerts */}
        {budgetAlert === "over" && (
          <LinearGradient colors={["#FF6B6B", "#E17055"]} style={styles.alertBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="warning" size={18} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Budget Exceeded!</Text>
              <Text style={styles.alertSub}>
                Spent {fmt(thisMonthExpenses)} of {fmt(user?.budgetLimit ?? 0)} this month
              </Text>
            </View>
            <Text style={styles.alertPct}>{budgetPercent.toFixed(0)}%</Text>
          </LinearGradient>
        )}
        {budgetAlert === "danger" && (
          <LinearGradient colors={["#E17055", "#FDCB6E"]} style={styles.alertBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Nearing Budget Limit</Text>
              <Text style={styles.alertSub}>
                {fmt(budgetRemaining)} remaining from {fmt(user?.budgetLimit ?? 0)}
              </Text>
            </View>
            <Text style={styles.alertPct}>{budgetPercent.toFixed(0)}%</Text>
          </LinearGradient>
        )}
        {budgetAlert === "warning" && (
          <View style={[styles.alertBannerSoft, { backgroundColor: "#FDCB6E18", borderColor: "#FDCB6E40" }]}>
            <Ionicons name="information-circle" size={16} color="#FDCB6E" />
            <Text style={[styles.alertSoftText, { color: "#FDCB6E" }]}>
              50% of monthly budget used · {fmt(budgetRemaining)} left
            </Text>
          </View>
        )}

        {/* Smart Stats Row */}
        <View style={styles.smartRow}>
          <View style={[styles.smartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.smartIcon, { backgroundColor: "#FF6B6B18" }]}>
              <Ionicons name="today" size={14} color="#FF6B6B" />
            </View>
            <Text style={[styles.smartLabel, { color: colors.mutedForeground }]}>Today</Text>
            <Text style={[styles.smartValue, { color: "#FF6B6B" }]}>{fmt(todayExpenses)}</Text>
          </View>
          <View style={[styles.smartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.smartIcon, { backgroundColor: "#6C5CE718" }]}>
              <Ionicons name="calendar" size={14} color="#6C5CE7" />
            </View>
            <Text style={[styles.smartLabel, { color: colors.mutedForeground }]}>This Month</Text>
            <Text style={[styles.smartValue, { color: "#6C5CE7" }]}>{fmt(thisMonthExpenses)}</Text>
          </View>
          <View style={[styles.smartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.smartIcon, { backgroundColor: "#00B89418" }]}>
              <Ionicons name="shield-checkmark" size={14} color="#00B894" />
            </View>
            <Text style={[styles.smartLabel, { color: colors.mutedForeground }]}>Budget Left</Text>
            <Text style={[styles.smartValue, { color: "#00B894" }]}>{fmt(budgetRemaining)}</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <SummaryCard title="Total Balance" amount={balance} variant="balance" />
        </View>

        {/* Income / Expense / Savings */}
        <View style={styles.row}>
          <SummaryCard title="Income" amount={totalIncome} variant="income" compact />
          <SummaryCard title="Expenses" amount={totalExpenses} variant="expense" compact />
        </View>
        <View style={styles.row}>
          <SummaryCard title="Savings" amount={savings} variant="savings" compact />
          {user?.budgetLimit ? (
            <View style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.budgetIconWrap, { backgroundColor: "#FDCB6E22" }]}>
                <Ionicons name="shield" size={14} color="#FDCB6E" />
              </View>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Budget</Text>
              <Text style={[styles.budgetAmount, { color: colors.foreground }]}>
                {fmt(user.budgetLimit)}
              </Text>
              <View style={[styles.budgetTrackBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.budgetTrackFill,
                    { width: `${budgetPercent}%`, backgroundColor: budgetPercent >= 100 ? "#FF6B6B" : budgetPercent >= 80 ? "#E17055" : budgetPercent >= 50 ? "#FDCB6E" : "#00B894" },
                  ]}
                />
              </View>
              <Text style={[styles.budgetPct, { color: colors.mutedForeground }]}>
                {budgetPercent.toFixed(0)}% used
              </Text>
            </View>
          ) : null}
        </View>

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
                  <TouchableOpacity
                    key={goal.id}
                    onPress={() => router.push("/(tabs)/goals")}
                    style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.goalIcon, { backgroundColor: goal.color + "20" }]}>
                      <Ionicons name={goal.icon as any} size={18} color={goal.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.goalTop}>
                        <Text style={[styles.goalName, { color: colors.foreground }]} numberOfLines={1}>{goal.name}</Text>
                        <Text style={[styles.goalAmt, { color: goal.color }]}>
                          {fmt(goal.savedAmount)} / {fmt(goal.targetAmount)}
                        </Text>
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
          <View>
            {recent.map((t) => (
              <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-transaction"); }}
        activeOpacity={0.85}
        style={[styles.fab, { bottom: fabBottom }]}
      >
        <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingTop: 4 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  username: { fontSize: 24, fontFamily: "Inter_700Bold" },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 14, marginBottom: 12,
  },
  alertTitle: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  alertSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  alertPct: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  alertBannerSoft: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 12, marginBottom: 12, borderWidth: 1,
  },
  alertSoftText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  smartRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  smartCard: { flex: 1, borderRadius: 16, padding: 12, borderWidth: 1, gap: 4 },
  smartIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  smartLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  smartValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  balanceCard: { marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  budgetCard: { flex: 1, borderRadius: 18, padding: 16, borderWidth: 1, gap: 4 },
  budgetIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  budgetLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  budgetAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  budgetTrackBg: { height: 5, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  budgetTrackFill: { height: "100%", borderRadius: 3 },
  budgetPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
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
