import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionCard } from "@/components/TransactionCard";

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, totalIncome, totalExpenses, balance, savings, isOverBudget, deleteTransaction } = useTransactions();

  const recent = transactions.slice(0, 8);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const fabBottom = insets.bottom + (Platform.OS === "web" ? 84 : 90);
  const budgetPct = user?.budgetLimit ? Math.min((totalExpenses / user.budgetLimit) * 100, 100) : 0;

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";

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

        {/* Budget Warning */}
        {isOverBudget && (
          <View style={styles.warningBanner}>
            <LinearGradient
              colors={["#E17055", "#FDCB6E"]}
              style={styles.warningGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.warningText}>
                Budget exceeded! ${totalExpenses.toFixed(2)} of ${(user?.budgetLimit ?? 0).toFixed(2)}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <SummaryCard title="Total Balance" amount={balance} variant="balance" />
        </View>

        {/* Row cards */}
        <View style={styles.row}>
          <SummaryCard title="Income" amount={totalIncome} variant="income" compact />
          <SummaryCard title="Expenses" amount={totalExpenses} variant="expense" compact />
        </View>

        {/* Savings + Budget row */}
        <View style={styles.row}>
          <SummaryCard title="Savings" amount={savings} variant="savings" compact />
          {user?.budgetLimit ? (
            <View style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.budgetIconWrap, { backgroundColor: "#FDCB6E22" }]}>
                <Ionicons name="shield" size={14} color="#FDCB6E" />
              </View>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Budget</Text>
              <Text style={[styles.budgetAmount, { color: colors.foreground }]}>${user.budgetLimit.toFixed(0)}</Text>
              <View style={[styles.budgetTrackBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.budgetTrackFill,
                    {
                      width: `${budgetPct}%`,
                      backgroundColor: budgetPct > 90 ? "#FF6B6B" : budgetPct > 60 ? "#FDCB6E" : "#00B894",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.budgetPct, { color: colors.mutedForeground }]}>{budgetPct.toFixed(0)}% used</Text>
            </View>
          ) : null}
        </View>

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
            <LinearGradient
              colors={["#6C5CE722", "#A29BFE22"]}
              style={styles.emptyIconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="receipt-outline" size={32} color="#6C5CE7" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No transactions yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap + to add your first transaction
            </Text>
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
        <LinearGradient
          colors={["#4834D4", "#6C5CE7"]}
          style={styles.fabGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: 4,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  username: { fontSize: 24, fontFamily: "Inter_700Bold" },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  warningBanner: { marginBottom: 14, borderRadius: 14, overflow: "hidden" },
  warningGrad: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 14,
  },
  warningText: { color: "#fff", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  balanceCard: { marginBottom: 12 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  budgetCard: {
    flex: 1, borderRadius: 18, padding: 16, borderWidth: 1, gap: 4,
  },
  budgetIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  budgetLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  budgetAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  budgetTrackBg: { height: 5, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  budgetTrackFill: { height: "100%", borderRadius: 3 },
  budgetPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8, marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: {
    alignItems: "center", padding: 40,
    borderRadius: 20, borderWidth: 1,
    borderStyle: "dashed", gap: 10,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  fab: {
    position: "absolute", right: 20,
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  fabGrad: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: "center", justifyContent: "center",
  },
});
