import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { getCategoryById } from "@/constants/categories";
import { useColors } from "@/hooks/useColors";
import type { Transaction } from "@/context/TransactionContext";
import { CategoryIcon } from "./CategoryIcon";

type Props = {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TransactionCard({ transaction, onDelete, onEdit }: Props) {
  const colors = useColors();
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

  function renderRightActions(_: Animated.AnimatedInterpolation<number>, drag: Animated.AnimatedInterpolation<number>) {
    const translateX = drag.interpolate({ inputRange: [-80, 0], outputRange: [0, 80], extrapolate: "clamp" });
    return (
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity onPress={handleEdit} style={[styles.action, { backgroundColor: colors.primary }]}>
            <Ionicons name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity onPress={handleDelete} style={[styles.action, { backgroundColor: colors.destructive }]}>
            <Ionicons name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CategoryIcon categoryId={transaction.category} size={46} iconSize={22} />
        <View style={styles.info}>
          <Text style={[styles.category, { color: colors.foreground }]} numberOfLines={1}>
            {cat.name}
          </Text>
          {transaction.notes ? (
            <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>
              {transaction.notes}
            </Text>
          ) : (
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>
              {formatDate(transaction.date)}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          <Text
            style={[
              styles.amount,
              { color: transaction.type === "income" ? colors.income : colors.expense },
            ]}
          >
            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 6,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
});
