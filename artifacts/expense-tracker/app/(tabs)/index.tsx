import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  FlatList,
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

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, totalIncome, totalExpenses, balance, savings, isOverBudget, deleteTransaction } = useTransactions();

  const recent = transactions.slice(0, 10);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/add-transaction");
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  }

  function handleEdit(id: string) {
    router.push({ pathname: "/edit-transaction", params: { id } });
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "ME";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: bottomPad + 120 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good day,</Text>
            <Text style={[styles.username, { color: colors.foreground }]}>{user?.username ?? "User"}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: user?.avatarColor ?? colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Budget Warning */}
        {isOverBudget && (
          <View style={[styles.warning, { backgroundColor: "#FDCB6E22", borderColor: "#FDCB6E" }]}>
            <Ionicons name="warning" size={18} color="#FDCB6E" />
            <Text style={[styles.warningText, { color: "#FDCB6E" }]}>
              Budget limit exceeded! ${totalExpenses.toFixed(2)} of ${(user?.budgetLimit ?? 0).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <SummaryCard title="Total Balance" amount={balance} variant="balance" />
        </View>

        {/* Row cards */}
        <View style={styles.row}>
          <SummaryCard title="Income" amount={totalIncome} variant="income" compact />
          <SummaryCard title="Expenses" amount={totalExpenses} variant="expense" compact />
        </View>
        <View style={[styles.savingsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.savingsLeft}>
            <View style={[styles.savingsIcon, { backgroundColor: "#0984E322" }]}>
              <Ionicons name="trending-up" size={20} color="#0984E3" />
            </View>
            <View>
              <Text style={[styles.savingsLabel, { color: colors.mutedForeground }]}>Savings</Text>
              <Text style={[styles.savingsAmount, { color: "#0984E3" }]}>${savings.toFixed(2)}</Text>
            </View>
          </View>
          {user?.budgetLimit ? (
            <View style={styles.budgetRight}>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Budget</Text>
              <Text style={[styles.budgetAmount, { color: colors.foreground }]}>${user.budgetLimit.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
          {transactions.length > 5 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No transactions yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap + to add your first transaction
            </Text>
          </View>
        ) : (
          <View style={{ gap: 0 }}>
            {recent.map((t) => (
              <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={handleAdd}
        activeOpacity={0.85}
        style={[styles.fab, { bottom: insets.bottom + (Platform.OS === "web" ? 84 : 90) }]}
      >
        <LinearGradient colors={["#6C5CE7", "#A29BFE"]} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={28} color="#fff" />
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
    marginBottom: 20,
    paddingTop: 8,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  username: { fontSize: 22, fontFamily: "Inter_700Bold" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  balanceCard: { marginBottom: 14 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  savingsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  savingsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  savingsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  savingsAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  budgetRight: { alignItems: "flex-end" },
  budgetLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  budgetAmount: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
