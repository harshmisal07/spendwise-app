import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { CategoryIcon } from "@/components/CategoryIcon";

type TxType = "income" | "expense";

function formatDateLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function EditTransactionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, updateTransaction } = useTransactions();

  const tx = transactions.find((t) => t.id === id);

  const [type, setType] = useState<TxType>(tx?.type ?? "expense");
  const [amount, setAmount] = useState(tx?.amount?.toString() ?? "");
  const [category, setCategory] = useState(tx?.category ?? "food");
  const [date, setDate] = useState(tx?.date ? new Date(tx.date + "T12:00:00") : new Date());
  const [notes, setNotes] = useState(tx?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tx) {
      Alert.alert("Error", "Transaction not found");
      router.back();
    }
  }, [tx]);

  const catList = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function adjustDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await updateTransaction(id!, { type, amount: num, category, date: toISODate(date), notes: notes.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update transaction");
    } finally {
      setSaving(false);
    }
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={type === "income" ? ["#00B894", "#55EFC4"] : ["#6C5CE7", "#A29BFE"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Transaction</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: bottomPad + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type Toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
            {(["expense", "income"] as TxType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => { setType(t); setCategory(t === "income" ? "salary" : "food"); Haptics.selectionAsync(); }}
                style={[styles.toggleBtn]}
              >
                {type === t ? (
                  <LinearGradient
                    colors={t === "income" ? ["#00B894", "#55EFC4"] : ["#6C5CE7", "#A29BFE"]}
                    style={styles.toggleGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name={t === "income" ? "arrow-up" : "arrow-down"} size={16} color="#fff" />
                    <Text style={styles.toggleTextActive}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.toggleGrad}>
                    <Text style={[styles.toggleTextInactive, { color: colors.mutedForeground }]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.foreground }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.border}
              autoFocus
            />
          </View>
          <View style={[styles.amountLine, { backgroundColor: type === "income" ? colors.income : colors.primary }]} />

          {/* Date */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
          <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>{formatDateLabel(date)}</Text>
            <TouchableOpacity
              onPress={() => adjustDate(1)}
              disabled={date.toDateString() === new Date().toDateString()}
              style={styles.dateArrow}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={date.toDateString() === new Date().toDateString() ? colors.border : colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.catGrid}>
            {catList.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => { setCategory(cat.id); Haptics.selectionAsync(); }}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: category === cat.id ? cat.color + "22" : colors.card,
                    borderColor: category === cat.id ? cat.color : colors.border,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <CategoryIcon categoryId={cat.id} size={36} iconSize={18} />
                <Text
                  style={[
                    styles.catBtnLabel,
                    { color: category === cat.id ? cat.color : colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          {/* Save */}
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient
              colors={type === "income" ? ["#00B894", "#55EFC4"] : ["#6C5CE7", "#A29BFE"]}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Update Transaction"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  form: { padding: 20 },
  toggle: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, borderRadius: 10, overflow: "hidden" },
  toggleGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleTextActive: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleTextInactive: { fontSize: 15, fontFamily: "Inter_500Medium" },
  amountSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  currencySymbol: { fontSize: 32, fontFamily: "Inter_400Regular", marginRight: 4, marginTop: 8 },
  amountInput: { fontSize: 52, fontFamily: "Inter_700Bold", textAlign: "center", minWidth: 120 },
  amountLine: { height: 2, borderRadius: 1, marginBottom: 28, marginHorizontal: 40 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  dateArrow: { padding: 16 },
  dateLabel: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  catBtn: {
    width: "30%",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    gap: 6,
  },
  catBtnLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    marginBottom: 28,
    textAlignVertical: "top",
  },
  saveBtn: {
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
});
