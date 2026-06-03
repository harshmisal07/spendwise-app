import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert, FlatList, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { TransactionCard } from "@/components/TransactionCard";
import { CATEGORIES } from "@/constants/categories";
import type { Transaction } from "@/context/TransactionContext";

type Filter = "all" | "income" | "expense";
type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date_desc", label: "Newest first" },
  { key: "date_asc", label: "Oldest first" },
  { key: "amount_desc", label: "Highest amount" },
  { key: "amount_asc", label: "Lowest amount" },
];

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction, totalIncome, totalExpenses } = useTransactions();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const activeCategories = useMemo(() => {
    const used = new Set(transactions.map((t) => t.category));
    return [{ id: "all", name: "All", icon: "apps", color: "#6C5CE7" }, ...CATEGORIES.filter((c) => used.has(c.id))];
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filter !== "all") list = list.filter((t) => t.type === filter);
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const cat = CATEGORIES.find((c) => c.id === t.category);
        return (
          (cat?.name.toLowerCase().includes(q) ?? false) ||
          t.notes.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
        );
      });
    }
    switch (sort) {
      case "date_asc":    return list.sort((a, b) => a.date.localeCompare(b.date));
      case "date_desc":   return list.sort((a, b) => b.date.localeCompare(a.date));
      case "amount_asc":  return list.sort((a, b) => a.amount - b.amount);
      case "amount_desc": return list.sort((a, b) => b.amount - a.amount);
      default: return list;
    }
  }, [transactions, filter, categoryFilter, search, sort]);

  function handleDelete(id: string) {
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deleteTransaction(id); } },
    ]);
  }

  function handleEdit(id: string) {
    router.push({ pathname: "/edit-transaction", params: { id } });
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Sort";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        {/* Title + Sort */}
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
          <TouchableOpacity
            onPress={() => setShowSortMenu((v) => !v)}
            style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.primary} />
            <Text style={[styles.sortBtnText, { color: colors.primary }]} numberOfLines={1}>{currentSortLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Menu */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {SORT_OPTIONS.map((o) => (
              <TouchableOpacity
                key={o.key}
                onPress={() => { setSort(o.key); setShowSortMenu(false); Haptics.selectionAsync(); }}
                style={[styles.sortMenuItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.sortMenuText, { color: sort === o.key ? colors.primary : colors.foreground, fontFamily: sort === o.key ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {o.label}
                </Text>
                {sort === o.key && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by category, notes, amount…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type filter */}
        <View style={styles.pills}>
          {(["all", "income", "expense"] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => { setFilter(f); Haptics.selectionAsync(); }}
              style={[styles.pill, { backgroundColor: filter === f ? "#6C5CE7" : colors.muted }]}
            >
              <Text style={[styles.pillText, { color: filter === f ? "#fff" : colors.mutedForeground }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.pillSpacer} />
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>{filtered.length} items</Text>
        </View>

        {/* Category filter (only show if there are multiple categories) */}
        {activeCategories.length > 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
            {activeCategories.map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategoryFilter(cat.id); Haptics.selectionAsync(); }}
                  style={[
                    styles.catChip,
                    { backgroundColor: active ? cat.color + "20" : colors.card, borderColor: active ? cat.color : colors.border, borderWidth: active ? 1.5 : 1 },
                  ]}
                >
                  <Ionicons name={cat.icon as any} size={13} color={active ? cat.color : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: active ? cat.color : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <FlatList<Transaction>
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionCard transaction={item} onDelete={handleDelete} onEdit={handleEdit} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={52} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search || filter !== "all" || categoryFilter !== "all" ? "No results found" : "No transactions yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search || filter !== "all" || categoryFilter !== "all"
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
  header: { paddingHorizontal: 16, paddingBottom: 8, zIndex: 10 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, maxWidth: 160 },
  sortBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  sortMenu: {
    borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  sortMenuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  sortMenuText: { fontSize: 14 },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pills: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  pill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  pillSpacer: { flex: 1 },
  countText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  catScroll: { marginBottom: 8 },
  catScrollContent: { gap: 8, paddingRight: 4 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipText: { fontSize: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
