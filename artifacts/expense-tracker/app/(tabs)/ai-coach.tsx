import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";
import { getCategoryById } from "@/constants/categories";

type InsightType = "tip" | "warning" | "success" | "info";

type Insight = {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  icon: string;
};

function computeHealthScore(params: {
  savingsRate: number;
  budgetPercent: number;
  budgetSet: boolean;
  goalProgress: number;
  hasGoals: boolean;
  txCount: number;
}): { score: number; grade: string; gradeColor: string; gradeDesc: string } {
  const { savingsRate, budgetPercent, budgetSet, goalProgress, hasGoals, txCount } = params;

  const savingsPts = Math.min((savingsRate / 20) * 40, 40);
  const budgetPts  = budgetSet
    ? Math.max(0, ((100 - budgetPercent) / 100) * 25)
    : 12;
  const goalPts    = hasGoals ? Math.min((goalProgress / 100) * 20, 20) : 10;
  const actPts     = Math.min((txCount / 30) * 15, 15);

  const score = Math.round(savingsPts + budgetPts + goalPts + actPts);

  const grade =
    score >= 80 ? "Excellent" :
    score >= 60 ? "Good" :
    score >= 40 ? "Average" :
    "Needs Work";

  const gradeColor =
    score >= 80 ? "#00B894" :
    score >= 60 ? "#74B9FF" :
    score >= 40 ? "#FDCB6E" :
    "#FF6B6B";

  const gradeDesc =
    score >= 80 ? "You're crushing your financial goals! Keep it up." :
    score >= 60 ? "You're on the right track. A few tweaks will get you to Excellent." :
    score >= 40 ? "Room for improvement. Focus on savings and budgeting." :
    "Time to take control. Start by tracking every expense.";

  return { score, grade, gradeColor, gradeDesc };
}

function generateInsights(params: {
  transactions: ReturnType<typeof useTransactions>["transactions"];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  budgetPercent: number;
  budgetLimit: number;
  budgetRemaining: number;
  goals: ReturnType<typeof useGoals>["goals"];
  format: (n: number) => string;
}): Insight[] {
  const {
    transactions, totalIncome, totalExpenses, balance,
    thisMonthIncome, thisMonthExpenses, budgetPercent,
    budgetLimit, budgetRemaining, goals, format,
  } = params;

  const insights: Insight[] = [];
  const now = new Date();

  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const lastMonth = transactions.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
  });

  const thisMonthByCategory: Record<string, number> = {};
  const lastMonthByCategory: Record<string, number> = {};
  thisMonth.filter((t) => t.type === "expense").forEach((t) => {
    thisMonthByCategory[t.category] = (thisMonthByCategory[t.category] ?? 0) + t.amount;
  });
  lastMonth.filter((t) => t.type === "expense").forEach((t) => {
    lastMonthByCategory[t.category] = (lastMonthByCategory[t.category] ?? 0) + t.amount;
  });

  const topCategory = Object.entries(thisMonthByCategory).sort((a, b) => b[1] - a[1])[0];

  if (topCategory) {
    const cat = getCategoryById(topCategory[0]);
    const lastAmt = lastMonthByCategory[topCategory[0]] ?? 0;
    const pct = lastAmt > 0 ? ((topCategory[1] - lastAmt) / lastAmt) * 100 : 0;
    if (pct > 20) {
      insights.push({
        id: "category_spike",
        type: "warning",
        title: `${cat.name} spending is up`,
        body: `You spent ${format(topCategory[1])} on ${cat.name} this month — ${Math.abs(pct).toFixed(0)}% more than last month (${format(lastAmt)}). Consider setting a category budget.`,
        icon: "trending-up",
      });
    } else {
      insights.push({
        id: "top_category",
        type: "info",
        title: `Top expense: ${cat.name}`,
        body: `${cat.name} is your biggest expense this month at ${format(topCategory[1])}. It makes up ${thisMonthExpenses > 0 ? ((topCategory[1] / thisMonthExpenses) * 100).toFixed(0) : 0}% of total spending.`,
        icon: "pie-chart",
      });
    }
  }

  if (budgetLimit > 0) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth  = now.getDate();
    const projectedExp = dayOfMonth > 0 ? (thisMonthExpenses / dayOfMonth) * daysInMonth : 0;
    if (projectedExp > budgetLimit) {
      const overBy = projectedExp - budgetLimit;
      insights.push({
        id: "budget_projection",
        type: "warning",
        title: "Budget may be exceeded",
        body: `At your current spending rate, you're projected to spend ${format(projectedExp)} this month — ${format(overBy)} over your ${format(budgetLimit)} budget. You have ${format(budgetRemaining)} remaining.`,
        icon: "alert-circle",
      });
    } else if (budgetPercent < 50) {
      insights.push({
        id: "budget_on_track",
        type: "success",
        title: "Budget is on track!",
        body: `You've used ${budgetPercent.toFixed(0)}% of your monthly budget. You have ${format(budgetRemaining)} remaining — you're managing your spending well.`,
        icon: "shield-checkmark",
      });
    }
  }

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  if (savingsRate >= 20) {
    insights.push({
      id: "savings_great",
      type: "success",
      title: `${savingsRate.toFixed(0)}% savings rate — excellent!`,
      body: `You're saving ${savingsRate.toFixed(0)}% of your total income. Financial experts recommend at least 20%. Keep it up!`,
      icon: "rocket",
    });
  } else if (savingsRate > 0 && savingsRate < 10) {
    const tenPct = totalIncome * 0.10;
    insights.push({
      id: "savings_low",
      type: "tip",
      title: "Boost your savings rate",
      body: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 10–20% of income. Saving just ${format(tenPct)} per month could transform your finances over time.`,
      icon: "bulb",
    });
  }

  if (topCategory && totalIncome > 0) {
    const savingTip = topCategory[1] * 0.1;
    insights.push({
      id: "saving_tip",
      type: "tip",
      title: `Quick win: reduce ${getCategoryById(topCategory[0]).name}`,
      body: `Cutting your ${getCategoryById(topCategory[0]).name} spending by just 10% could save you ${format(savingTip)} per month — ${format(savingTip * 12)} per year.`,
      icon: "flash",
    });
  }

  const activeGoals = goals.filter((g) => g.savedAmount < g.targetAmount);
  if (activeGoals.length > 0) {
    const nearest = activeGoals.sort((a, b) => {
      const aDiff = a.targetAmount - a.savedAmount;
      const bDiff = b.targetAmount - b.savedAmount;
      return aDiff - bDiff;
    })[0];
    const needed = nearest.targetAmount - nearest.savedAmount;
    const monthsLeft = nearest.targetDate
      ? Math.max(1, Math.ceil((new Date(nearest.targetDate).getTime() - Date.now()) / (30 * 86400000)))
      : 6;
    const perMonth = needed / monthsLeft;
    insights.push({
      id: "goal_pace",
      type: "info",
      title: `Goal tip: ${nearest.name}`,
      body: `You need ${format(needed)} more to reach your "${nearest.name}" goal. Save ${format(perMonth)}/month to hit it on time.`,
      icon: "trophy",
    });
  }

  const lastMonthExp = lastMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  if (lastMonthExp > 0 && thisMonthExpenses < lastMonthExp * 0.9) {
    insights.push({
      id: "spending_down",
      type: "success",
      title: "Spending is down this month!",
      body: `You've spent ${format(thisMonthExpenses)} so far this month, compared to ${format(lastMonthExp)} all of last month. Great progress!`,
      icon: "trending-down",
    });
  }

  if (transactions.length === 0) {
    insights.push({
      id: "get_started",
      type: "tip",
      title: "Start tracking today",
      body: "Add your first income and expense transactions to unlock personalized AI insights about your spending habits.",
      icon: "add-circle",
    });
  }

  return insights.slice(0, 6);
}

const ICON_MAP: Record<InsightType, string> = {
  warning: "alert-circle",
  success: "checkmark-circle",
  tip:     "bulb",
  info:    "information-circle",
};
const COLOR_MAP: Record<InsightType, string> = {
  warning: "#FDCB6E",
  success: "#00B894",
  tip:     "#A29BFE",
  info:    "#74B9FF",
};

export default function AICoachScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { user } = useAuth();
  const { format } = useCurrency();
  const {
    transactions, totalIncome, totalExpenses, balance,
    thisMonthIncome, thisMonthExpenses, budgetPercent, budgetRemaining,
  } = useTransactions();
  const { goals } = useGoals();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 110;
  const budgetLimit = user?.budgetLimit ?? 0;

  const savingsRate = totalIncome > 0
    ? Math.max(0, ((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0;

  const goalProgress = useMemo(() => {
    const total  = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved  = goals.reduce((s, g) => s + g.savedAmount, 0);
    return total > 0 ? (saved / total) * 100 : 0;
  }, [goals]);

  const { score, grade, gradeColor, gradeDesc } = useMemo(() =>
    computeHealthScore({
      savingsRate,
      budgetPercent,
      budgetSet: budgetLimit > 0,
      goalProgress,
      hasGoals: goals.length > 0,
      txCount: transactions.length,
    }), [savingsRate, budgetPercent, budgetLimit, goalProgress, goals.length, transactions.length]
  );

  const insights = useMemo(() =>
    generateInsights({
      transactions, totalIncome, totalExpenses, balance,
      thisMonthIncome, thisMonthExpenses, budgetPercent, budgetLimit,
      budgetRemaining, goals, format,
    }), [transactions, totalIncome, totalExpenses, balance,
      thisMonthIncome, thisMonthExpenses, budgetPercent, budgetLimit,
      budgetRemaining, goals, format]
  );

  const scoreArc = Math.min(score, 100);

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<"gemini" | "rule-based" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => ({ name: getCategoryById(id).name, amount }));
  }, [transactions]);

  const fetchAIInsights = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
      const res = await fetch(`${apiBase}/ai-insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: thisMonthIncome,
          monthlyExpenses: thisMonthExpenses,
          savingsRate,
          budgetPercent,
          budgetLimit,
          balance,
          topCategories,
          goals: goals.map((g) => ({ name: g.name, savedAmount: g.savedAmount, targetAmount: g.targetAmount })),
          transactionCount: transactions.length,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setAiInsights(data.insights ?? []);
      setAiSource(data.source ?? "rule-based");
    } catch (err: any) {
      setAiError("Could not load AI analysis. Check your connection.");
    } finally {
      setAiLoading(false);
    }
  }, [thisMonthIncome, thisMonthExpenses, savingsRate, budgetPercent, budgetLimit, balance, topCategories, goals, transactions.length]);

  const metrics = [
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(0)}%`,
      icon: "trending-up",
      color: savingsRate >= 20 ? "#00B894" : savingsRate >= 10 ? "#FDCB6E" : "#FF6B6B",
      desc: savingsRate >= 20 ? "Excellent" : savingsRate >= 10 ? "Good" : "Low",
    },
    {
      label: "Budget Used",
      value: `${budgetPercent.toFixed(0)}%`,
      icon: "shield",
      color: budgetPercent >= 100 ? "#FF6B6B" : budgetPercent >= 80 ? "#FDCB6E" : "#00B894",
      desc: budgetPercent >= 100 ? "Exceeded" : budgetPercent >= 80 ? "Near Limit" : "On Track",
    },
    {
      label: "Goal Progress",
      value: `${goalProgress.toFixed(0)}%`,
      icon: "trophy",
      color: goalProgress >= 50 ? "#00B894" : goalProgress >= 20 ? "#74B9FF" : "#A29BFE",
      desc: goals.length === 0 ? "No Goals" : goalProgress >= 50 ? "Halfway!" : "In Progress",
    },
    {
      label: "Transactions",
      value: transactions.length.toString(),
      icon: "list",
      color: "#A29BFE",
      desc: transactions.length >= 30 ? "Active" : transactions.length >= 10 ? "Building" : "Getting Started",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>AI Finance Coach</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Powered by your real data
          </Text>
        </View>
        <View style={[styles.aiBadge, { backgroundColor: "#6C5CE720" }]}>
          <Ionicons name="sparkles" size={14} color="#6C5CE7" />
          <Text style={[styles.aiBadgeText, { color: "#6C5CE7" }]}>AI</Text>
        </View>
      </View>

      {/* Health Score Card */}
      <LinearGradient colors={["#4834D4", "#6C5CE7", "#A29BFE"]} style={styles.scoreCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.scoreLeft}>
          <Text style={styles.scoreTitle}>Financial Health Score</Text>
          <View style={styles.scoreNumRow}>
            <Text style={styles.scoreNum}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={[styles.gradeBadge, { backgroundColor: gradeColor + "30" }]}>
            <View style={[styles.gradeDot, { backgroundColor: gradeColor }]} />
            <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
          </View>
          <Text style={styles.gradeDesc}>{gradeDesc}</Text>
        </View>
        <View style={styles.scoreRight}>
          <View style={styles.gauge}>
            <View style={[styles.gaugeArc, { borderColor: "rgba(255,255,255,0.15)" }]} />
            <View style={[styles.gaugeFill, { borderColor: gradeColor, opacity: scoreArc / 100 + 0.3 }]} />
            <View style={styles.gaugeCenter}>
              <Ionicons name="heart" size={28} color={gradeColor} />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Metric Cards */}
      <View style={styles.metricsGrid}>
        {metrics.map((m) => (
          <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: m.color + "20" }]}>
              <Ionicons name={m.icon as any} size={16} color={m.color} />
            </View>
            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.foreground }]} numberOfLines={1}>{m.label}</Text>
            <Text style={[styles.metricDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
          </View>
        ))}
      </View>

      {/* Score Breakdown */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Score Breakdown</Text>
        {[
          { label: "Savings Rate",    pts: Math.min((savingsRate / 20) * 40, 40).toFixed(0), max: 40, color: "#00B894"  },
          { label: "Budget Control",  pts: (budgetLimit > 0 ? Math.max(0, ((100 - budgetPercent) / 100) * 25) : 12).toFixed(0), max: 25, color: "#74B9FF"  },
          { label: "Goals Progress",  pts: (goals.length > 0 ? Math.min((goalProgress / 100) * 20, 20) : 10).toFixed(0), max: 20, color: "#A29BFE"  },
          { label: "Tracking Habit",  pts: Math.min((transactions.length / 30) * 15, 15).toFixed(0), max: 15, color: "#FDCB6E" },
        ].map((row) => (
          <View key={row.label} style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>{row.label}</Text>
            <View style={[styles.breakdownBarBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.breakdownBarFill, { width: `${(Number(row.pts) / row.max) * 100}%`, backgroundColor: row.color }]} />
            </View>
            <Text style={[styles.breakdownPts, { color: row.color }]}>{row.pts}/{row.max}</Text>
          </View>
        ))}
      </View>

      {/* Gemini AI Analysis */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
        <View style={styles.geminiHeader}>
          <View style={[styles.geminiIcon, { backgroundColor: "#6C5CE720" }]}>
            <Ionicons name="sparkles" size={18} color="#6C5CE7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 2 }]}>AI-Powered Analysis</Text>
            <Text style={[styles.geminiSub, { color: colors.mutedForeground }]}>
              {aiSource === "gemini" ? "Powered by Gemini AI" : "Smart rule-based insights"}
            </Text>
          </View>
          {aiSource && (
            <View style={[styles.sourcePill, { backgroundColor: aiSource === "gemini" ? "#6C5CE720" : "#FDCB6E20" }]}>
              <Text style={[styles.sourceText, { color: aiSource === "gemini" ? "#6C5CE7" : "#FDCB6E" }]}>
                {aiSource === "gemini" ? "Gemini" : "Rule-based"}
              </Text>
            </View>
          )}
        </View>

        {aiInsights.length === 0 && !aiLoading && !aiError && (
          <Text style={[styles.geminiHint, { color: colors.mutedForeground }]}>
            Analyze your finances with AI to get personalized, data-driven recommendations.
          </Text>
        )}

        {aiError && (
          <View style={[styles.aiError, { backgroundColor: "#FF6B6B15", borderColor: "#FF6B6B40" }]}>
            <Ionicons name="wifi-outline" size={14} color="#FF6B6B" />
            <Text style={[styles.aiErrorText, { color: "#FF6B6B" }]}>{aiError}</Text>
          </View>
        )}

        {aiInsights.length > 0 && (
          <View style={{ gap: 10, marginBottom: 14 }}>
            {aiInsights.map((insight, i) => (
              <View key={i} style={[styles.aiInsightRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.aiInsightNum, { backgroundColor: "#6C5CE720" }]}>
                  <Text style={[styles.aiInsightNumText, { color: "#6C5CE7" }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.aiInsightText, { color: colors.foreground }]}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={fetchAIInsights}
          disabled={aiLoading}
          activeOpacity={0.85}
          style={[styles.analyzeBtn, { opacity: aiLoading ? 0.7 : 1 }]}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles" size={16} color="#fff" />
          )}
          <Text style={styles.analyzeBtnText}>
            {aiLoading ? "Analyzing…" : aiInsights.length > 0 ? "Refresh Analysis" : "Generate AI Analysis"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Insights */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Personalized Insights
      </Text>
      {insights.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="sparkles-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add transactions to unlock AI insights
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {insights.map((insight) => (
            <View key={insight.id} style={[styles.insightCard, { backgroundColor: colors.card, borderColor: COLOR_MAP[insight.type] + "40", borderLeftColor: COLOR_MAP[insight.type] }]}>
              <View style={[styles.insightIcon, { backgroundColor: COLOR_MAP[insight.type] + "20" }]}>
                <Ionicons name={insight.icon as any} size={18} color={COLOR_MAP[insight.type]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.insightTitle, { color: colors.foreground }]}>{insight.title}</Text>
                <Text style={[styles.insightBody, { color: colors.mutedForeground }]}>{insight.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Tips */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={16} color="#FDCB6E" />
          <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 0 }]}>Finance Tips</Text>
        </View>
        {[
          { tip: "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings." },
          { tip: "Build an emergency fund covering 3–6 months of expenses." },
          { tip: "Pay yourself first — automate savings before you spend." },
          { tip: "Review subscriptions monthly and cancel unused ones." },
          { tip: "Track every rupee — awareness is the first step to change." },
        ].map((item, i) => (
          <View key={i} style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: "#FDCB6E" }]} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{item.tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 2 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  aiBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  scoreCard: { borderRadius: 24, padding: 24, flexDirection: "row", marginBottom: 16, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  scoreLeft: { flex: 1 },
  scoreTitle: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  scoreNumRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginBottom: 8 },
  scoreNum: { color: "#fff", fontSize: 52, fontFamily: "Inter_700Bold", lineHeight: 56 },
  scoreMax: { color: "rgba(255,255,255,0.6)", fontSize: 20, fontFamily: "Inter_400Regular" },
  gradeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginBottom: 8 },
  gradeDot: { width: 7, height: 7, borderRadius: 3.5 },
  gradeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gradeDesc: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  scoreRight: { alignItems: "center", justifyContent: "center", width: 80 },
  gauge: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  gaugeArc: { position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 8 },
  gaugeFill: { position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 8 },
  gaugeCenter: { alignItems: "center", justifyContent: "center" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  metricCard: { width: "47.5%", borderRadius: 16, padding: 14, borderWidth: 1, gap: 3 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  metricValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metricDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 14 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  breakdownLabel: { width: 110, fontSize: 12, fontFamily: "Inter_500Medium" },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  breakdownBarFill: { height: "100%", borderRadius: 3 },
  breakdownPts: { width: 36, textAlign: "right", fontSize: 11, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  insightCard: { flexDirection: "row", gap: 12, borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 14 },
  insightIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  insightTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 4 },
  insightBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  emptyCard: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  geminiHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  geminiIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  geminiSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sourcePill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  sourceText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  geminiHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 14 },
  aiError: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12 },
  aiErrorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  aiInsightRow: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  aiInsightNum: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  aiInsightNumText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  aiInsightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  analyzeBtn: { borderRadius: 12, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#6C5CE7" },
  analyzeBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
