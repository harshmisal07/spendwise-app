import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { TransactionCard } from "@/components/TransactionCard";
import { CATEGORIES } from "@/constants/categories";
import type { Transaction } from "@/context/TransactionContext";

type Filter = "all" | "income" | "expense";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useTransactions();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const cat = CATEGORIES.find((c) => c.id === t.category);
        return (
          (cat?.name.toLowerCase().includes(q) ?? false) ||
          t.notes.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filter, search, categoryFilter]);

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteTransaction(id);
        },
      },
    ]);
  }

  function handleEdit(id: string) {
    router.push({ pathname: "/edit-transaction", params: { id } });
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expense" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
        {/* Filter pills */}
        <View style={styles.pills}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.pill,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: filter === f.key ? "#fff" : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList<Transaction>
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TransactionCard transaction={item} onDelete={handleDelete} onEdit={handleEdit} />
        )}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: bottomPad,
          gap: 0,
          flexGrow: 1,
        }}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search || filter !== "all" ? "No results found" : "No transactions yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search || filter !== "all"
                ? "Try different search terms or filters"
                : "Add your first transaction from the dashboard"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pills: { flexDirection: "row", gap: 8 },
  pill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
