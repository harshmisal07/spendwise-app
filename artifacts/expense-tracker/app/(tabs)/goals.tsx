import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGoals, GOAL_COLORS, GOAL_ICONS } from "@/context/GoalsContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";
import { useChallenges } from "@/context/ChallengesContext";
import { useAchievements } from "@/context/AchievementsContext";
import { useNotifications } from "@/context/NotificationsContext";

type Tab = "goals" | "challenges";

function daysLeft(targetDate: string): string {
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff}d left`;
}

const STATUS_COLOR: Record<string, string> = {
  active:    "#74B9FF",
  completed: "#00B894",
  failed:    "#FF6B6B",
  available: "#A29BFE",
};
const STATUS_LABEL: Record<string, string> = {
  active:    "Active",
  completed: "Completed!",
  failed:    "Try Again",
  available: "Join",
};

export default function GoalsScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { goals, addGoal, addToSaved, deleteGoal, totalSaved, totalTarget } = useGoals();
  const { format, symbol } = useCurrency();
  const { challenges, activeChallenges, joinChallenge, leaveChallenge, getStatus, getProgress, getActiveDays } = useChallenges();
  const { xp, level, levelTitle } = useAchievements();
  const { sendGoalReminder, settings: notifSettings } = useNotifications();

  useEffect(() => {
    if (!notifSettings.goalReminders || goals.length === 0) return;
    goals.forEach((g) => {
      if (g.savedAmount >= g.targetAmount) return;
      const diff = Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / 86400000);
      if (diff >= 0 && diff <= 7) sendGoalReminder(g.name, diff);
    });
  }, [goals, notifSettings.goalReminders]);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 110;

  const [activeTab,  setActiveTab]  = useState<Tab>("goals");
  const [showAdd,    setShowAdd]    = useState(false);
  const [fundGoalId, setFundGoalId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [name,          setName]          = useState("");
  const [target,        setTarget]        = useState("");
  const [targetDate,    setTargetDate]    = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [selectedIcon,  setSelectedIcon]  = useState(GOAL_ICONS[0]);
  const [saving,        setSaving]        = useState(false);

  const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length;
  const overallPct     = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  async function handleAdd() {
    if (!name.trim()) { Alert.alert("Required", "Please enter a goal name"); return; }
    const amt = parseFloat(target);
    if (!target || isNaN(amt) || amt <= 0) { Alert.alert("Required", "Please enter a valid target amount"); return; }
    setSaving(true);
    try {
      await addGoal({ name: name.trim(), icon: selectedIcon, color: selectedColor, targetAmount: amt, targetDate });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName(""); setTarget(""); setShowAdd(false);
    } catch { Alert.alert("Error", "Failed to save goal"); }
    setSaving(false);
  }

  async function handleAddFunds() {
    if (!fundGoalId) return;
    const amt = parseFloat(fundAmount);
    if (!fundAmount || isNaN(amt) || amt <= 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    await addToSaved(fundGoalId, amt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFundGoalId(null); setFundAmount("");
  }

  function handleDelete(id: string, name: string) {
    Alert.alert("Delete Goal", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  }

  async function handleJoinLeave(id: string) {
    const status = getStatus(id);
    if (status === "available") {
      await joinChallenge(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (status === "active") {
      Alert.alert("Leave Challenge", "Are you sure you want to leave this challenge?", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: () => leaveChallenge(id) },
      ]);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              {activeTab === "goals" ? "Savings Goals" : "Challenges"}
            </Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              {activeTab === "goals" ? "Track your financial dreams" : "Build better money habits"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {activeTab === "goals" && (
              <TouchableOpacity onPress={() => { setShowAdd(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.addBtnWrap}>
                <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="add" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={[styles.tabRow, { backgroundColor: colors.muted }]}>
          {(["goals", "challenges"] as Tab[]).map((tab) => (
            <TouchableOpacity key={tab} onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }} style={[styles.tabBtn, activeTab === tab && { overflow: "hidden" }]}>
              {activeTab === tab ? (
                <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.tabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name={tab === "goals" ? "trophy" : "flash"} size={14} color="#fff" />
                  <Text style={styles.tabTextActive}>{tab === "goals" ? "Goals" : "Challenges"}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Ionicons name={tab === "goals" ? "trophy-outline" : "flash-outline"} size={14} color={colors.mutedForeground} />
                  <Text style={[styles.tabTextInactive, { color: colors.mutedForeground }]}>{tab === "goals" ? "Goals" : "Challenges"}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GOALS TAB ── */}
        {activeTab === "goals" && (
          <>
            {goals.length > 0 && (
              <>
                <LinearGradient colors={["#4834D4", "#6C5CE7", "#A29BFE"]} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Saved</Text>
                    <Text style={styles.summaryValue}>{format(totalSaved)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Target</Text>
                    <Text style={styles.summaryValue}>{format(totalTarget)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Done</Text>
                    <Text style={styles.summaryValue}>{completedGoals}/{goals.length}</Text>
                  </View>
                </LinearGradient>

                <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.overallRow}>
                    <Text style={[styles.overallLabel, { color: colors.foreground }]}>Overall Progress</Text>
                    <Text style={[styles.overallPct, { color: "#6C5CE7" }]}>{overallPct.toFixed(0)}%</Text>
                  </View>
                  <View style={[styles.overallBarBg, { backgroundColor: colors.muted }]}>
                    <LinearGradient colors={["#4834D4", "#6C5CE7", "#A29BFE"]} style={[styles.overallBarFill, { width: `${overallPct}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  </View>
                  <Text style={[styles.overallSub, { color: colors.mutedForeground }]}>
                    {format(totalSaved)} saved of {format(totalTarget)} across {goals.length} goal{goals.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </>
            )}

            {goals.length === 0 ? (
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <LinearGradient colors={["#6C5CE722", "#A29BFE22"]} style={styles.emptyIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="trophy-outline" size={36} color="#6C5CE7" />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No goals yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Tap + to create your first savings goal</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.emptyAddBtn}>
                  <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.emptyAddGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.emptyAddText}>Create Goal</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {goals.map((goal) => {
                  const pct  = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
                  const done = pct >= 100;
                  return (
                    <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: done ? goal.color : colors.border }]}>
                      {done && (
                        <LinearGradient colors={[goal.color, goal.color + "CC"]} style={styles.goalDoneBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Ionicons name="checkmark-circle" size={12} color="#fff" />
                          <Text style={styles.goalDoneText}>GOAL REACHED!</Text>
                        </LinearGradient>
                      )}
                      <View style={[styles.goalHeader, done && { marginTop: 10 }]}>
                        <View style={[styles.goalIcon, { backgroundColor: goal.color + "20" }]}>
                          <Ionicons name={goal.icon as any} size={22} color={goal.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                          <Text style={[styles.goalDate, { color: colors.mutedForeground }]}>
                            🗓 {new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {"  ·  "}
                            <Text style={{ color: goal.color }}>{daysLeft(goal.targetDate)}</Text>
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(goal.id, goal.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.goalAmounts}>
                        <View>
                          <Text style={[styles.goalAmtLabel, { color: colors.mutedForeground }]}>Saved</Text>
                          <Text style={[styles.goalAmtValue, { color: goal.color }]}>{format(goal.savedAmount)}</Text>
                        </View>
                        <View style={{ alignItems: "center" }}>
                          <Text style={[styles.goalAmtLabel, { color: colors.mutedForeground }]}>Progress</Text>
                          <Text style={[styles.goalPct, { color: colors.foreground }]}>{pct.toFixed(0)}%</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={[styles.goalAmtLabel, { color: colors.mutedForeground }]}>Target</Text>
                          <Text style={[styles.goalAmtValue, { color: colors.foreground }]}>{format(goal.targetAmount)}</Text>
                        </View>
                      </View>

                      <View style={[styles.goalBarBg, { backgroundColor: colors.muted }]}>
                        <LinearGradient
                          colors={[goal.color, goal.color + "AA"]}
                          style={[styles.goalBarFill, { width: `${pct}%` }]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                      </View>

                      {!done && (
                        <TouchableOpacity onPress={() => { setFundGoalId(goal.id); setFundAmount(""); }}
                          style={[styles.addFundsBtn, { borderColor: goal.color + "60", backgroundColor: goal.color + "12" }]}>
                          <Ionicons name="add-circle-outline" size={16} color={goal.color} />
                          <Text style={[styles.addFundsText, { color: goal.color }]}>Add Funds</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── CHALLENGES TAB ── */}
        {activeTab === "challenges" && (
          <>
            {/* XP Card */}
            <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.xpCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View>
                <Text style={styles.xpLabel}>Your Level</Text>
                <Text style={styles.xpLevel}>Level {level} · {levelTitle}</Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.xpNum}>{xp}</Text>
                <Text style={styles.xpSuffix}>XP</Text>
              </View>
            </LinearGradient>

            <View style={{ gap: 12 }}>
              {challenges.map((ch) => {
                const status  = getStatus(ch.id);
                const progress = getProgress(ch.id);
                const days    = getActiveDays(ch.id);
                const statusColor = STATUS_COLOR[status] ?? "#A29BFE";
                return (
                  <View key={ch.id} style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: status === "active" ? ch.color + "60" : colors.border }]}>
                    <View style={styles.challengeHeader}>
                      <View style={[styles.challengeIcon, { backgroundColor: ch.color + "20" }]}>
                        <Ionicons name={ch.icon as any} size={20} color={ch.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{ch.title}</Text>
                        <Text style={[styles.challengeDesc, { color: colors.mutedForeground }]}>{ch.description}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleJoinLeave(ch.id)}
                        disabled={status === "completed" || status === "failed"}
                        style={[styles.joinBtn, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}
                      >
                        <Text style={[styles.joinBtnText, { color: statusColor }]}>
                          {STATUS_LABEL[status] ?? "Join"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.challengeMeta}>
                      <View style={styles.challengeMetaItem}>
                        <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.challengeMetaText, { color: colors.mutedForeground }]}>{ch.durationDays}d challenge</Text>
                      </View>
                      <View style={styles.challengeMetaItem}>
                        <Ionicons name="star-outline" size={12} color="#FDCB6E" />
                        <Text style={[styles.challengeMetaText, { color: "#FDCB6E" }]}>+{ch.xpReward} XP</Text>
                      </View>
                      {status === "active" && (
                        <View style={styles.challengeMetaItem}>
                          <Ionicons name="calendar-outline" size={12} color={ch.color} />
                          <Text style={[styles.challengeMetaText, { color: ch.color }]}>Day {days + 1}</Text>
                        </View>
                      )}
                    </View>

                    {(status === "active" || status === "completed") && (
                      <>
                        <View style={[styles.challengeBarBg, { backgroundColor: colors.muted }]}>
                          <View style={[styles.challengeBarFill, { width: `${progress}%`, backgroundColor: status === "completed" ? "#00B894" : ch.color }]} />
                        </View>
                        <Text style={[styles.challengeProgress, { color: colors.mutedForeground }]}>
                          {progress.toFixed(0)}% complete
                        </Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal visible={fundGoalId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Funds</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{goals.find((g) => g.id === fundGoalId)?.name}</Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.modalCurrency, { color: colors.mutedForeground }]}>{symbol}</Text>
                <TextInput style={[styles.modalInputText, { color: colors.foreground }]} value={fundAmount} onChangeText={setFundAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.mutedForeground} autoFocus />
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => { setFundGoalId(null); setFundAmount(""); }} style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddFunds} activeOpacity={0.85} style={{ flex: 1 }}>
                  <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.modalConfirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.modalConfirmText}>Add Funds</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={[styles.addSheet, { backgroundColor: colors.card }]}>
                <View style={styles.modalHandle} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Savings Goal</Text>

                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>GOAL NAME</Text>
                <View style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput style={[styles.formInputText, { color: colors.foreground }]} value={name} onChangeText={setName} placeholder="e.g. New Phone, Vacation, Emergency Fund" placeholderTextColor={colors.mutedForeground} />
                </View>

                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>TARGET AMOUNT ({symbol})</Text>
                <View style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.modalCurrency, { color: colors.mutedForeground }]}>{symbol}</Text>
                  <TextInput style={[styles.formInputText, { color: colors.foreground }]} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.mutedForeground} />
                </View>

                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>TARGET DATE</Text>
                <View style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
                  <TextInput style={[styles.formInputText, { color: colors.foreground }]} value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" />
                </View>

                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>COLOUR</Text>
                <View style={styles.colorRow}>
                  {GOAL_COLORS.map((c) => (
                    <TouchableOpacity key={c} onPress={() => { setSelectedColor(c); Haptics.selectionAsync(); }}
                      style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 0, borderColor: "#fff" }]} />
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>ICON</Text>
                <View style={styles.iconRow}>
                  {GOAL_ICONS.map((icon) => (
                    <TouchableOpacity key={icon} onPress={() => { setSelectedIcon(icon); Haptics.selectionAsync(); }}
                      style={[styles.iconBtn, { backgroundColor: selectedIcon === icon ? selectedColor + "25" : colors.background, borderColor: selectedIcon === icon ? selectedColor : colors.border, borderWidth: selectedIcon === icon ? 2 : 1 }]}>
                      <Ionicons name={icon as any} size={22} color={selectedIcon === icon ? selectedColor : colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAdd} disabled={saving} activeOpacity={0.85} style={{ flex: 1 }}>
                    <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.modalConfirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.modalConfirmText}>{saving ? "Saving…" : "Create Goal"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 2 },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtnWrap: { shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  addBtnGrad: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabRow: { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, borderRadius: 10 },
  tabGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabInactive: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  tabTextActive: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabTextInactive: { fontSize: 13, fontFamily: "Inter_500Medium" },
  summaryCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 12, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  summaryValue: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },
  overallCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  overallRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  overallLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  overallPct: { fontSize: 16, fontFamily: "Inter_700Bold" },
  overallBarBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  overallBarFill: { height: "100%", borderRadius: 4 },
  overallSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  goalCard: { borderRadius: 20, padding: 18, borderWidth: 1, overflow: "hidden" },
  goalDoneBadge: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 5 },
  goalDoneText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  goalIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  goalName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 3 },
  goalDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  goalAmounts: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  goalAmtLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 2 },
  goalAmtValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  goalPct: { fontSize: 15, fontFamily: "Inter_700Bold" },
  goalBarBg: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  goalBarFill: { height: "100%", borderRadius: 4 },
  addFundsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 10 },
  addFundsText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 40, borderRadius: 20, borderWidth: 1, borderStyle: "dashed", gap: 12, marginTop: 20 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyAddBtn: { marginTop: 4, borderRadius: 14, overflow: "hidden" },
  emptyAddGrad: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  emptyAddText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  xpCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  xpLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  xpLevel: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  xpRight: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  xpNum: { color: "#FDCB6E", fontSize: 36, fontFamily: "Inter_700Bold" },
  xpSuffix: { color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  challengeCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 10 },
  challengeHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  challengeIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  challengeTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
  challengeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  joinBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, flexShrink: 0 },
  joinBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  challengeMeta: { flexDirection: "row", gap: 14 },
  challengeMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  challengeMetaText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  challengeBarBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  challengeBarFill: { height: "100%", borderRadius: 3 },
  challengeProgress: { fontSize: 11, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  addSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#B2BEC3", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  modalInput: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 60, marginBottom: 20, gap: 8 },
  modalCurrency: { fontSize: 22, fontFamily: "Inter_400Regular" },
  modalInputText: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  formLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  formInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, marginBottom: 4, gap: 8 },
  formInputText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconBtn: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
