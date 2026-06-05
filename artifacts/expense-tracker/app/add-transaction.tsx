import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency, CURRENCIES } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { RecurringInterval } from "@/context/TransactionContext";
import VoiceInput, { type VoiceResult } from "@/components/VoiceInput";

type TxType = "income" | "expense";

function formatDateLabel(d: Date): string {
  const today     = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const RECURRING_OPTIONS: { key: RecurringInterval; label: string; icon: string }[] = [
  { key: "none",    label: "Once",    icon: "remove-circle-outline"    },
  { key: "daily",   label: "Daily",   icon: "sunny-outline"             },
  { key: "weekly",  label: "Weekly",  icon: "calendar-clear-outline"    },
  { key: "monthly", label: "Monthly", icon: "calendar-outline"          },
];

export default function AddTransactionScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { addTransaction }        = useTransactions();
  const { currency, symbol }      = useCurrency();

  const [type,         setType]        = useState<TxType>("expense");
  const [amount,       setAmount]      = useState("");
  const [category,     setCategory]    = useState("food");
  const [date,         setDate]        = useState(new Date());
  const [notes,        setNotes]       = useState("");
  const [recurring,    setRecurring]   = useState<RecurringInterval>("none");
  const [saving,       setSaving]      = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);

  function handleVoiceResult(result: VoiceResult) {
    setVoiceVisible(false);
    if (result.type) setType(result.type);
    if (result.amount && !isNaN(result.amount)) setAmount(result.amount.toString());
    if (result.note) setNotes(result.note);
    if (result.category) {
      const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
      const match = allCats.find((c) => c.id === result.category || c.name.toLowerCase().includes(result.category!));
      if (match) setCategory(match.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const catList   = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isIncome  = type === "income";
  const gradColors: [string, string] = isIncome ? ["#00B894", "#00CEC9"] : ["#4834D4", "#6C5CE7"];

  function adjustDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0");
      return;
    }
    setSaving(true);
    try {
      await addTransaction({ type, amount: num, category, date: toISODate(date), notes: notes.trim(), recurring });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isToday   = date.toDateString() === new Date().toDateString();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradColors} style={[styles.header, { paddingTop: insets.top + 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Transaction</Text>
        <TouchableOpacity onPress={() => setVoiceVisible(true)} style={styles.closeBtn}>
          <Ionicons name="mic" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.form, { paddingBottom: bottomPad + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Type Toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.muted }]}>
            {(["expense", "income"] as TxType[]).map((t) => (
              <TouchableOpacity key={t} onPress={() => { setType(t); setCategory(t === "income" ? "salary" : "food"); Haptics.selectionAsync(); }} style={styles.toggleBtn}>
                {type === t ? (
                  <LinearGradient colors={t === "income" ? ["#00B894", "#00CEC9"] : ["#4834D4", "#6C5CE7"]} style={styles.toggleGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name={t === "income" ? "arrow-up" : "arrow-down"} size={16} color="#fff" />
                    <Text style={styles.toggleTextActive}>{t === "income" ? "Income" : "Expense"}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.toggleGrad, { backgroundColor: "transparent" }]}>
                    <Text style={[styles.toggleTextInactive, { color: colors.mutedForeground }]}>{t === "income" ? "Income" : "Expense"}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>{symbol}</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.foreground }]}
              value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.border} autoFocus
            />
          </View>
          <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>{CURRENCIES[currency].name}</Text>
          <View style={[styles.amountLine, { backgroundColor: isIncome ? "#00B894" : "#6C5CE7" }]} />

          {/* Date */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Date</Text>
          <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.dateArrow}>
              <Ionicons name="chevron-back" size={22} color="#6C5CE7" />
            </TouchableOpacity>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>{formatDateLabel(date)}</Text>
            <TouchableOpacity onPress={() => adjustDate(1)} disabled={isToday} style={styles.dateArrow}>
              <Ionicons name="chevron-forward" size={22} color={isToday ? colors.border : "#6C5CE7"} />
            </TouchableOpacity>
          </View>

          {/* Category */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.catGrid}>
            {catList.map((cat) => {
              const selected = category === cat.id;
              return (
                <TouchableOpacity key={cat.id} onPress={() => { setCategory(cat.id); Haptics.selectionAsync(); }}
                  style={[styles.catBtn, { backgroundColor: selected ? cat.color + "20" : colors.card, borderColor: selected ? cat.color : colors.border, borderWidth: selected ? 2 : 1 }]}>
                  <CategoryIcon categoryId={cat.id} size={38} iconSize={19} />
                  <Text style={[styles.catBtnLabel, { color: selected ? cat.color : colors.mutedForeground, fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular" }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Recurring */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Repeat</Text>
          <View style={styles.recurringRow}>
            {RECURRING_OPTIONS.map((opt) => {
              const active = recurring === opt.key;
              return (
                <TouchableOpacity key={opt.key} onPress={() => { setRecurring(opt.key); Haptics.selectionAsync(); }}
                  style={[styles.recurringBtn, { backgroundColor: active ? "#6C5CE720" : colors.card, borderColor: active ? "#6C5CE7" : colors.border, borderWidth: active ? 2 : 1 }]}>
                  <Ionicons name={opt.icon as any} size={18} color={active ? "#6C5CE7" : colors.mutedForeground} />
                  <Text style={[styles.recurringLabel, { color: active ? "#6C5CE7" : colors.mutedForeground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {recurring !== "none" && (
            <View style={[styles.recurringNote, { backgroundColor: "#6C5CE710", borderColor: "#6C5CE730" }]}>
              <Ionicons name="information-circle" size={14} color="#6C5CE7" />
              <Text style={[styles.recurringNoteText, { color: "#6C5CE7" }]}>
                Repeats {recurring} · shown as a reminder on your dashboard when due
              </Text>
            </View>
          )}

          {/* Notes */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={notes} onChangeText={setNotes} placeholder="What was this for?" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
          />

          {/* Save */}
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={gradColors} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name={saving ? "hourglass" : "checkmark-circle"} size={22} color="#fff" />
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Transaction"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Voice input hint */}
          <TouchableOpacity onPress={() => setVoiceVisible(true)} style={[styles.voiceHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="mic-outline" size={16} color="#6C5CE7" />
            <Text style={[styles.voiceHintText, { color: colors.mutedForeground }]}>
              Or tap the mic to add by voice
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <VoiceInput
        visible={voiceVisible}
        onResult={handleVoiceResult}
        onClose={() => setVoiceVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  form: { padding: 20 },
  toggle: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, borderRadius: 10, overflow: "hidden" },
  toggleGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 10 },
  toggleTextActive: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  toggleTextInactive: { fontSize: 15, fontFamily: "Inter_500Medium" },
  amountSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  currencySymbol: { fontSize: 32, fontFamily: "Inter_400Regular", marginRight: 4, marginTop: 8 },
  currencyLabel: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 6 },
  amountInput: { fontSize: 56, fontFamily: "Inter_700Bold", textAlign: "center", minWidth: 120 },
  amountLine: { height: 3, borderRadius: 2, marginBottom: 28, marginHorizontal: 40 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  dateRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  dateArrow: { padding: 16 },
  dateLabel: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  catBtn: { width: "30%", borderRadius: 14, padding: 10, alignItems: "center", gap: 6 },
  catBtnLabel: { fontSize: 11, textAlign: "center" },
  recurringRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  recurringBtn: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 5 },
  recurringLabel: { fontSize: 11, textAlign: "center" },
  recurringNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 10, marginBottom: 24, borderWidth: 1 },
  recurringNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 84, marginBottom: 28, textAlignVertical: "top" },
  saveBtn: { borderRadius: 16, height: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  voiceHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 12 },
  voiceHintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
