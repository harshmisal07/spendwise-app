import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { getCategoryById } from "@/constants/categories";
import { useColors } from "@/hooks/useColors";
import { useCurrency } from "@/context/CurrencyContext";
import type { Transaction } from "@/context/TransactionContext";
import { CategoryIcon } from "./CategoryIcon";

type Props = {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const RECURRING_LABEL: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly",
};

export function TransactionCard({ transaction, onDelete, onEdit }: Props) {
  const colors = useColors();
  const { format } = useCurrency();
  const cat = getCategoryById(transaction.category);
  const swipeRef = useRef<Swipeable>(null);

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeRef.current?.close();
    onDelete(transaction.id);
  }

  function handleEdit() {
    swipeRef.current?.close();
    onEdit(transaction.id);
  }

  function renderRightActions(
    _: Animated.AnimatedInterpolation<number>,
    drag: Animated.AnimatedInterpolation<number>
  ) {
    const translateX = drag.interpolate({
      inputRange: [-100, 0], outputRange: [0, 100], extrapolate: "clamp",
    });
    return (
      <Animated.View style={[styles.actions, { transform: [{ translateX }] }]}>
        <TouchableOpacity onPress={handleEdit} style={[styles.action, { backgroundColor: "#6C5CE7" }]}>
          <Ionicons name="pencil" size={17} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={[styles.action, { backgroundColor: "#FF6B6B" }]}>
          <Ionicons name="trash" size={17} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const isIncome = transaction.type === "income";
  const recurringLabel = transaction.recurring && transaction.recurring !== "none"
    ? RECURRING_LABEL[transaction.recurring]
    : null;

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CategoryIcon categoryId={transaction.category} size={46} iconSize={22} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.category, { color: colors.foreground }]} numberOfLines={1}>
              {cat.name}
            </Text>
            {recurringLabel && (
              <View style={styles.recurringBadge}>
                <Ionicons name="refresh" size={9} color="#6C5CE7" />
                <Text style={styles.recurringText}>{recurringLabel}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
            {transaction.notes ? transaction.notes : formatDate(transaction.date)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: isIncome ? "#00B894" : "#FF6B6B" }]}>
            {isIncome ? "+" : "−"}{format(transaction.amount)}
          </Text>
          {transaction.notes ? (
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(transaction.date)}</Text>
          ) : null}
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", padding: 14, marginHorizontal: 16, marginVertical: 4, borderRadius: 18, borderWidth: 1, gap: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  category: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  recurringBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#6C5CE715", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  recurringText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#6C5CE7" },
  notes: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 3 },
  amount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", alignItems: "center", paddingRight: 8, gap: 6 },
  action: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
