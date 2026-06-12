import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";
import { getCategoryById } from "@/constants/categories";

type Role = "user" | "model";

type Message = {
  id: string;
  role: Role;
  content: string;
  loading?: boolean;
};

const SUGGESTED = [
  "Why am I overspending?",
  "How do I save ₹1 lakh in 6 months?",
  "Where can I cut expenses?",
  "Am I saving enough?",
  "How do I start a SIP?",
  "Explain my spending pattern",
];

function TypingBubble({ colors }: { colors: any }) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.bubbleText, { color: colors.mutedForeground }]}>
        {"●".repeat(dots) + "○".repeat(3 - dots)}
      </Text>
    </View>
  );
}

export default function AIChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, totalIncome, totalExpenses, balance, thisMonthIncome, thisMonthExpenses, budgetPercent } = useTransactions();
  const { goals } = useGoals();
  const { format, currency } = useCurrency();
  const listRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: `Hi ${user?.username ?? "there"}! 👋 I'm your AI finance coach. I can see your real spending data and help you make smarter money decisions.\n\nWhat's on your mind?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const savingsRate = totalIncome > 0
    ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, amount]) => ({ name: getCategoryById(id).name, amount }));
  }, [transactions]);

  const budgetLimit = user?.budgetLimit ?? 0;

  const financialContext = useMemo(() => ({
    monthlyIncome: thisMonthIncome,
    monthlyExpenses: thisMonthExpenses,
    savingsRate,
    balance,
    budgetLimit,
    budgetPercent,
    topCategories,
    goals: goals.map((g) => ({ name: g.name, savedAmount: g.savedAmount, targetAmount: g.targetAmount })),
    currency,
  }), [thisMonthIncome, thisMonthExpenses, savingsRate, balance, budgetLimit, budgetPercent, topCategories, goals, currency]);

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const typingId = `typing-${Date.now()}`;

    setMessages((prev) => [...prev, userMsg, { id: typingId, role: "model", content: "", loading: true }]);
    setInput("");
    setLoading(true);
    Haptics.selectionAsync();

    try {
      const apiBase ="http://10.128.49.176:3000/api";
      const history = [...messages, userMsg]
        .filter((m) => !m.loading && m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${apiBase}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: financialContext }),
      });

      const data = await res.json();
      const reply = data.reply ?? "Sorry, I couldn't respond. Please try again.";

      setMessages((prev) => prev.map((m) =>
        m.id === typingId
          ? { id: typingId, role: "model", content: reply }
          : m
      ));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === typingId
          ? { id: typingId, role: "model", content: "Connection error. Please check your internet and try again." }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [loading, messages, financialContext]);

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    if (item.loading) return (
      <View style={styles.aiRow}>
        <View style={[styles.aiBubbleAvatar, { backgroundColor: "#6C5CE720" }]}>
          <Ionicons name="sparkles" size={14} color="#6C5CE7" />
        </View>
        <TypingBubble colors={colors} />
      </View>
    );
    if (isUser) return (
      <View style={styles.userRow}>
        <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={[styles.bubble, styles.userBubble]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.userBubbleText}>{item.content}</Text>
        </LinearGradient>
      </View>
    );
    return (
      <View style={styles.aiRow}>
        <View style={[styles.aiBubbleAvatar, { backgroundColor: "#6C5CE720" }]}>
          <Ionicons name="sparkles" size={14} color="#6C5CE7" />
        </View>
        <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.bubbleText, { color: colors.foreground }]}>{item.content}</Text>
        </View>
      </View>
    );
  }

  const showSuggestions = messages.length === 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={["#4834D4", "#6C5CE7"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarRow}>
            <View style={styles.headerAvatar}>
              <Ionicons name="sparkles" size={16} color="#6C5CE7" />
            </View>
            <View>
              <Text style={styles.headerTitle}>SpendWise AI</Text>
              <Text style={styles.headerSub}>Powered by Gemini</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([{
              id: "welcome",
              role: "model",
              content: `Hi ${user?.username ?? "there"}! 👋 Fresh start — what would you like to talk about?`,
            }]);
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Context strip */}
      <View style={[styles.contextStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {[
          { label: "Income", value: format(thisMonthIncome), color: "#00B894" },
          { label: "Spent", value: format(thisMonthExpenses), color: "#FF6B6B" },
          { label: "Saved", value: `${savingsRate.toFixed(0)}%`, color: "#6C5CE7" },
          { label: "Balance", value: format(balance), color: "#FDCB6E" },
        ].map((item) => (
          <View key={item.label} style={styles.contextItem}>
            <Text style={[styles.contextValue, { color: item.color }]}>{item.value}</Text>
            <Text style={[styles.contextLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={showSuggestions ? (
            <View style={styles.suggestionsWrap}>
              <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>Try asking:</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTED.map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => sendMessage(q)}
                    style={[styles.suggestionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={12} color="#6C5CE7" />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 8,
        }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Ask anything about your finances…"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={400}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, { opacity: input.trim() && !loading ? 1 : 0.4 }]}
          >
            <LinearGradient
              colors={["#4834D4", "#6C5CE7"]}
              style={styles.sendBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading
                ? <ActivityIndicator size={18} color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 16, gap: 12,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerAvatarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "Inter_400Regular" },
  contextStrip: {
    flexDirection: "row", borderBottomWidth: 1,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  contextItem: { flex: 1, alignItems: "center" },
  contextValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  contextLabel: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 1 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  aiRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "88%" },
  userRow: { alignSelf: "flex-end", maxWidth: "82%" },
  aiBubbleAvatar: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  bubble: { borderRadius: 18, padding: 14 },
  userBubble: { borderBottomRightRadius: 4 },
  userBubbleText: { color: "#fff", fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  aiBubble: { borderBottomLeftRadius: 4, borderWidth: 1, flex: 1 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  suggestionsWrap: { marginTop: 12 },
  suggestionsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 10 },
  suggestionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  suggestionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 14, paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, fontFamily: "Inter_400Regular",
    maxHeight: 100, minHeight: 44,
  },
  sendBtn: { marginBottom: 2 },
  sendBtnGrad: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
});
