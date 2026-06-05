import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useTransactions } from "@/context/TransactionContext";
import { useGoals } from "@/context/GoalsContext";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/context/CurrencyContext";
import { useCategoryBudgets } from "@/context/CategoryBudgetContext";
import { useBackup } from "@/context/BackupContext";
import { useAchievements } from "@/context/AchievementsContext";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { CategoryIcon } from "@/components/CategoryIcon";

type ThemeOption = "light" | "dark" | "system";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  return d.toLocaleDateString();
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { transactions, totalIncome, totalExpenses } = useTransactions();
  const { goals } = useGoals();
  const { currency, setCurrency, format } = useCurrency();
  const { budgets, setBudget, removeBudget, getCategorySpent, getCategoryPercent } = useCategoryBudgets();

  const { lastBackupAt, lastRestoreAt, isBackingUp, isRestoring, backup, restore } = useBackup();
  const { badges, xp, level, levelTitle, xpToNextLevel, xpProgress, earnedCount, totalCount } = useAchievements();
  const [editingUsername, setEditingUsername]   = useState(false);
  const [newUsername,     setNewUsername]       = useState(user?.username ?? "");
  const [editingBudget,   setEditingBudget]     = useState(false);
  const [newBudget,       setNewBudget]         = useState(user?.budgetLimit?.toString() ?? "20000");
  const [changingPass,    setChangingPass]      = useState(false);
  const [currentPass,     setCurrentPass]       = useState("");
  const [newPass,         setNewPass]           = useState("");
  const [confirmPass,     setConfirmPass]       = useState("");
  const [showPasswords,   setShowPasswords]     = useState(false);

  // Category budget modal
  const [catBudgetModal,  setCatBudgetModal]    = useState<string | null>(null);
  const [catBudgetAmt,    setCatBudgetAmt]      = useState("");

  const topPad        = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad     = Platform.OS === "web" ? 34 + 84 : 100;
  const initials      = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";
  const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length;

  async function handleSaveUsername() {
    if (!newUsername.trim()) { Alert.alert("Invalid", "Username cannot be empty"); return; }
    await updateUser({ username: newUsername.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingUsername(false);
  }

  async function handleSaveBudget() {
    const val = parseFloat(newBudget);
    if (isNaN(val) || val < 0) { Alert.alert("Invalid", "Please enter a valid budget amount"); return; }
    await updateUser({ budgetLimit: val });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingBudget(false);
  }

  async function handleChangePassword() {
    if (!currentPass || !newPass || !confirmPass) { Alert.alert("Missing Fields", "Please fill all password fields"); return; }
    if (currentPass !== user?.password) { Alert.alert("Incorrect Password", "Current password is incorrect"); return; }
    if (newPass.length < 6) { Alert.alert("Weak Password", "New password must be at least 6 characters"); return; }
    if (newPass !== confirmPass) { Alert.alert("Mismatch", "New passwords do not match"); return; }
    await updateUser({ password: newPass });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Password changed successfully");
    setChangingPass(false);
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
  }

  async function handleBackup() {
    const result = await backup();
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Backup Saved ✓", result.message);
    } else {
      Alert.alert("Backup Failed", result.message);
    }
  }

  async function handleRestore() {
    Alert.alert(
      "Restore from Cloud",
      "This will overwrite your local data with the cloud backup. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            const result = await restore();
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Restored ✓", `${result.message}. Please restart the app to see changes.`);
            } else {
              Alert.alert("Restore Failed", result.message);
            }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  }

  async function handleSaveCatBudget() {
    if (!catBudgetModal) return;
    const val = parseFloat(catBudgetAmt);
    if (!catBudgetAmt || isNaN(val) || val <= 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    await setBudget(catBudgetModal, val);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCatBudgetModal(null);
    setCatBudgetAmt("");
  }

  const THEMES: { key: ThemeOption; label: string; icon: string }[] = [
    { key: "light",  label: "Light",  icon: "sunny"                  },
    { key: "dark",   label: "Dark",   icon: "moon"                   },
    { key: "system", label: "Auto",   icon: "phone-portrait-outline" },
  ];

  function Section({ children }: { children: React.ReactNode }) {
    return <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>;
  }

  function SectionRow({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: "#6C5CE720" }]}>
          <Ionicons name={icon as any} size={16} color="#6C5CE7" />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>

        {/* Avatar Card */}
        <LinearGradient colors={["#4834D4", "#6C5CE7", "#A29BFE"]} style={styles.avatarCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.avatarName}>{user?.username}</Text>
            <Text style={styles.avatarEmail}>{user?.email}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={12} color="#FDCB6E" />
            <Text style={styles.memberText}>Member</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Transactions", value: transactions.length.toString(), color: "#6C5CE7" },
            { label: "Income",       value: format(totalIncome),            color: "#00B894" },
            { label: "Expenses",     value: format(totalExpenses),          color: "#FF6B6B" },
            { label: "Goals Done",   value: `${completedGoals}/${goals.length}`, color: "#FDCB6E" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements & XP */}
        <Section>
          <SectionRow icon="trophy-outline" title="Achievements & XP" />
          {/* Level Card */}
          <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.levelCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelLabel}>Level {level}</Text>
              <Text style={styles.levelTitle}>{levelTitle}</Text>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
              </View>
              <Text style={styles.xpHint}>
                {xp} XP · {xpToNextLevel > 0 ? `${xpToNextLevel} XP to next level` : "Max Level!"}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeNum}>{level}</Text>
            </View>
          </LinearGradient>

          {/* Badges Summary */}
          <View style={styles.badgeSummary}>
            <View style={[styles.badgeSummaryItem, { borderColor: colors.border }]}>
              <Text style={[styles.badgeSummaryNum, { color: "#FDCB6E" }]}>{earnedCount}</Text>
              <Text style={[styles.badgeSummaryLabel, { color: colors.mutedForeground }]}>Earned</Text>
            </View>
            <View style={[styles.badgeSummaryItem, { borderColor: colors.border }]}>
              <Text style={[styles.badgeSummaryNum, { color: colors.mutedForeground }]}>{totalCount - earnedCount}</Text>
              <Text style={[styles.badgeSummaryLabel, { color: colors.mutedForeground }]}>Locked</Text>
            </View>
            <View style={[styles.badgeSummaryItem, { borderColor: colors.border }]}>
              <Text style={[styles.badgeSummaryNum, { color: "#6C5CE7" }]}>{xp}</Text>
              <Text style={[styles.badgeSummaryLabel, { color: colors.mutedForeground }]}>Total XP</Text>
            </View>
          </View>

          {/* Badge Grid */}
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, {
                backgroundColor: badge.earned ? badge.color + "15" : colors.muted,
                borderColor: badge.earned ? badge.color + "50" : colors.border,
                opacity: badge.earned ? 1 : 0.5,
              }]}>
                <View style={[styles.badgeIconWrap, { backgroundColor: badge.earned ? badge.color + "25" : colors.background }]}>
                  <Ionicons name={badge.icon as any} size={18} color={badge.earned ? badge.color : colors.mutedForeground} />
                </View>
                <Text style={[styles.badgeTitle, { color: badge.earned ? colors.foreground : colors.mutedForeground }]} numberOfLines={2}>
                  {badge.title}
                </Text>
                {badge.earned ? (
                  <View style={[styles.badgeXpPill, { backgroundColor: badge.color + "25" }]}>
                    <Text style={[styles.badgeXpText, { color: badge.color }]}>+{badge.xp} XP</Text>
                  </View>
                ) : (
                  <Text style={[styles.badgeLocked, { color: colors.mutedForeground }]}>{badge.description.split(" ").slice(0, 3).join(" ")}…</Text>
                )}
              </View>
            ))}
          </View>
        </Section>

        {/* Currency Selector */}
        <Section>
          <SectionRow icon="globe-outline" title="Currency" />
          <View style={styles.currencyGrid}>
            {(Object.values(CURRENCIES) as typeof CURRENCIES[CurrencyCode][]).map((c) => {
              const active = currency === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => { setCurrency(c.code); Haptics.selectionAsync(); }}
                  style={[styles.currencyBtn, { backgroundColor: active ? "#6C5CE720" : colors.muted, borderColor: active ? "#6C5CE7" : "transparent", borderWidth: 1.5 }]}
                >
                  <Text style={styles.currencyFlag}>{c.flag}</Text>
                  <Text style={[styles.currencySymbol, { color: active ? "#6C5CE7" : colors.foreground }]}>{c.symbol}</Text>
                  <Text style={[styles.currencyCode, { color: active ? "#6C5CE7" : colors.mutedForeground }]}>{c.code}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Auto-detected from your timezone · tap to change
          </Text>
        </Section>

        {/* Username */}
        <Section>
          <SectionRow icon="person-outline" title="Username" />
          {editingUsername ? (
            <View style={styles.editRow}>
              <TextInput style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={newUsername} onChangeText={setNewUsername} autoFocus onSubmitEditing={handleSaveUsername} />
              <TouchableOpacity onPress={handleSaveUsername} style={[styles.actionBtn, { backgroundColor: "#6C5CE7" }]}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingUsername(false); setNewUsername(user?.username ?? ""); }} style={[styles.actionBtn, { backgroundColor: colors.muted }]}><Ionicons name="close" size={18} color={colors.mutedForeground} /></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>{user?.username}</Text>
              <TouchableOpacity onPress={() => setEditingUsername(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="pencil" size={16} color={colors.primary} /></TouchableOpacity>
            </View>
          )}
        </Section>

        {/* Monthly Budget */}
        <Section>
          <SectionRow icon="wallet-outline" title="Monthly Budget" />
          {editingBudget ? (
            <View style={styles.editRow}>
              <Text style={[{ fontSize: 16, fontFamily: "Inter_400Regular", color: colors.mutedForeground }]}>
                {CURRENCIES[currency].symbol}
              </Text>
              <TextInput style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, flex: 1 }]} value={newBudget} onChangeText={setNewBudget} keyboardType="decimal-pad" autoFocus onSubmitEditing={handleSaveBudget} />
              <TouchableOpacity onPress={handleSaveBudget} style={[styles.actionBtn, { backgroundColor: "#6C5CE7" }]}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingBudget(false); setNewBudget(user?.budgetLimit?.toString() ?? "20000"); }} style={[styles.actionBtn, { backgroundColor: colors.muted }]}><Ionicons name="close" size={18} color={colors.mutedForeground} /></TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>{format(user?.budgetLimit ?? 0)}</Text>
              <TouchableOpacity onPress={() => setEditingBudget(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="pencil" size={16} color={colors.primary} /></TouchableOpacity>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Alerts at 50% · 80% · 100% of this limit</Text>
        </Section>

        {/* Category Budgets */}
        <Section>
          <SectionRow icon="pricetags-outline" title="Category Budgets" />
          <Text style={[styles.hint, { color: colors.mutedForeground, marginBottom: 12 }]}>
            Set monthly spending limits per category
          </Text>
          <View style={{ gap: 10 }}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const existing = budgets.find((b) => b.categoryId === cat.id);
              const spent = getCategorySpent(cat.id);
              const pct   = getCategoryPercent(cat.id);
              return (
                <View key={cat.id} style={[styles.catBudgetRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <CategoryIcon categoryId={cat.id} size={36} iconSize={18} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.catBudgetTop}>
                      <Text style={[styles.catBudgetName, { color: colors.foreground }]}>{cat.name}</Text>
                      {existing ? (
                        <Text style={[styles.catBudgetLimit, { color: colors.mutedForeground }]}>
                          {format(spent)} / {format(existing.monthlyLimit)}
                        </Text>
                      ) : (
                        <Text style={[styles.catBudgetNoLimit, { color: colors.mutedForeground }]}>No limit</Text>
                      )}
                    </View>
                    {existing && (
                      <View style={[styles.catBudgetBarBg, { backgroundColor: colors.muted }]}>
                        <View style={[styles.catBudgetBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? "#FF6B6B" : pct >= 80 ? "#E17055" : cat.color }]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.catBudgetActions}>
                    <TouchableOpacity onPress={() => { setCatBudgetModal(cat.id); setCatBudgetAmt(existing?.monthlyLimit.toString() ?? ""); }} style={[styles.catBudgetBtn, { backgroundColor: "#6C5CE715" }]}>
                      <Ionicons name="pencil" size={14} color="#6C5CE7" />
                    </TouchableOpacity>
                    {existing && (
                      <TouchableOpacity onPress={() => removeBudget(cat.id)} style={[styles.catBudgetBtn, { backgroundColor: "#FF6B6B15" }]}>
                        <Ionicons name="close" size={14} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Section>

        {/* Change Password */}
        <Section>
          <SectionRow icon="lock-closed-outline" title="Change Password">
            <TouchableOpacity onPress={() => setChangingPass((v) => !v)} style={[styles.togglePassBtn, { backgroundColor: changingPass ? "#FF6B6B18" : "#6C5CE718" }]}>
              <Text style={[styles.togglePassText, { color: changingPass ? "#FF6B6B" : "#6C5CE7" }]}>{changingPass ? "Cancel" : "Change"}</Text>
            </TouchableOpacity>
          </SectionRow>
          {changingPass && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {[
                { key: "current", label: "Current password", value: currentPass, setter: setCurrentPass },
                { key: "new",     label: "New password",     value: newPass,     setter: setNewPass     },
                { key: "confirm", label: "Confirm new",      value: confirmPass, setter: setConfirmPass },
              ].map((f) => (
                <View key={f.key} style={[styles.passInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput style={[styles.passInputText, { color: colors.foreground }]} placeholder={f.label} placeholderTextColor={colors.mutedForeground} value={f.value} onChangeText={f.setter} secureTextEntry={!showPasswords} autoCapitalize="none" />
                </View>
              ))}
              <TouchableOpacity onPress={() => setShowPasswords((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
                <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }]}>{showPasswords ? "Hide" : "Show"} passwords</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChangePassword} style={[styles.savePassBtn, { backgroundColor: "#6C5CE7" }]}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.savePassText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* Appearance */}
        <Section>
          <SectionRow icon="color-palette-outline" title="Appearance" />
          <View style={styles.themeRow}>
            {THEMES.map((t) => (
              <TouchableOpacity key={t.key} onPress={() => { setTheme(t.key); Haptics.selectionAsync(); }}
                style={[styles.themeBtn, { backgroundColor: theme === t.key ? "#6C5CE720" : colors.muted, borderColor: theme === t.key ? "#6C5CE7" : "transparent", borderWidth: 1.5 }]}>
                <Ionicons name={t.icon as any} size={20} color={theme === t.key ? "#6C5CE7" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: theme === t.key ? "#6C5CE7" : colors.mutedForeground }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* App Info */}
        <Section>
          <SectionRow icon="information-circle-outline" title="App Info" />
          {[
            { label: "App Name",   value: "SpendWise"   },
            { label: "Version",    value: "1.0.0"       },
            { label: "Currency",   value: `${CURRENCIES[currency].flag} ${CURRENCIES[currency].name} (${currency})` },
            { label: "Storage",    value: "Local Device" },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </Section>

        {/* Cloud Backup */}
        <Section>
          <SectionRow icon="cloud-outline" title="Cloud Backup" />
          <View style={styles.backupStatus}>
            <View style={styles.backupStatusItem}>
              <Ionicons name="cloud-upload-outline" size={14} color={lastBackupAt ? "#00B894" : colors.mutedForeground} />
              <Text style={[styles.backupStatusText, { color: lastBackupAt ? "#00B894" : colors.mutedForeground }]}>
                {lastBackupAt ? `Backed up ${fmtTime(lastBackupAt)}` : "Never backed up"}
              </Text>
            </View>
            {lastRestoreAt && (
              <View style={styles.backupStatusItem}>
                <Ionicons name="cloud-download-outline" size={14} color="#74B9FF" />
                <Text style={[styles.backupStatusText, { color: "#74B9FF" }]}>
                  Restored {fmtTime(lastRestoreAt)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.backupBtnRow}>
            <TouchableOpacity
              onPress={handleBackup}
              disabled={isBackingUp || isRestoring}
              style={[styles.backupBtn, { flex: 1, opacity: isBackingUp ? 0.7 : 1 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#00B894", "#00CEC9"]} style={styles.backupBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name={isBackingUp ? "hourglass-outline" : "cloud-upload"} size={16} color="#fff" />
                <Text style={styles.backupBtnText}>{isBackingUp ? "Saving…" : "Back Up Now"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isBackingUp || isRestoring}
              style={[styles.backupBtn, { flex: 1, opacity: isRestoring ? 0.7 : 1 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={["#6C5CE7", "#A29BFE"]} style={styles.backupBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name={isRestoring ? "hourglass-outline" : "cloud-download"} size={16} color="#fff" />
                <Text style={styles.backupBtnText}>{isRestoring ? "Restoring…" : "Restore Data"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Backs up all transactions, goals, budgets & currency preference
          </Text>
        </Section>

        {/* Premium CTA */}
        <TouchableOpacity onPress={() => router.push("/(tabs)/payment")} activeOpacity={0.85}>
          <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.upgradeBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="diamond" size={20} color="#FDCB6E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSub}>Cloud backup · AI insights · Unlimited everything</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: "#FF6B6B15", borderColor: "#FF6B6B40" }]} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={[styles.logoutText, { color: "#FF6B6B" }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Budget Modal */}
      <Modal visible={catBudgetModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Set Category Budget</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                {EXPENSE_CATEGORIES.find((c) => c.id === catBudgetModal)?.name} · Monthly limit
              </Text>
              <View style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.modalCurrency, { color: colors.mutedForeground }]}>{CURRENCIES[currency].symbol}</Text>
                <TextInput
                  style={[styles.modalInputText, { color: colors.foreground }]}
                  value={catBudgetAmt} onChangeText={setCatBudgetAmt}
                  keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.mutedForeground} autoFocus
                />
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => { setCatBudgetModal(null); setCatBudgetAmt(""); }} style={[styles.modalCancelBtn, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveCatBudget} activeOpacity={0.85} style={{ flex: 1 }}>
                  <LinearGradient colors={["#4834D4", "#6C5CE7"]} style={styles.modalConfirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.modalConfirmText}>Set Limit</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 16 },
  avatarCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14, shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  avatarName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  avatarEmail: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  memberText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: "center" },
  statValue: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 2, width: "100%", textAlign: "center" },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  currencyGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  currencyBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", gap: 4 },
  currencyFlag: { fontSize: 20 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold" },
  currencyCode: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  actionBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  value: { fontSize: 16, fontFamily: "Inter_500Medium" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  catBudgetRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  catBudgetTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catBudgetName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  catBudgetLimit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  catBudgetNoLimit: { fontSize: 11, fontFamily: "Inter_400Regular" },
  catBudgetBarBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  catBudgetBarFill: { height: "100%", borderRadius: 2 },
  catBudgetActions: { flexDirection: "row", gap: 6 },
  catBudgetBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  togglePassBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  togglePassText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  passInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48 },
  passInputText: { fontSize: 15, fontFamily: "Inter_400Regular", height: "100%" },
  savePassBtn: { borderRadius: 12, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  savePassText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", gap: 6 },
  themeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_500Medium", maxWidth: "60%", textAlign: "right" },
  backupStatus: { gap: 4, marginBottom: 12 },
  backupStatusItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  backupStatusText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  backupBtnRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  backupBtn: { borderRadius: 12, overflow: "hidden" },
  backupBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 14 },
  backupBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginVertical: 2 },
  upgradeBanner: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  upgradeTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  upgradeSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, padding: 16, borderWidth: 1 },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  levelCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  levelLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  levelTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  xpBarBg: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 6 },
  xpBarFill: { height: "100%", borderRadius: 3, backgroundColor: "#FDCB6E" },
  xpHint: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  levelBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  levelBadgeNum: { color: "#fff", fontSize: 26, fontFamily: "Inter_700Bold" },
  badgeSummary: { flexDirection: "row", marginBottom: 14, borderRadius: 12, overflow: "hidden" },
  badgeSummaryItem: { flex: 1, alignItems: "center", paddingVertical: 10, borderRightWidth: 1 },
  badgeSummaryNum: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  badgeSummaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeCard: { width: "30.5%", borderRadius: 14, padding: 10, borderWidth: 1, alignItems: "center", gap: 5 },
  badgeIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badgeTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center", lineHeight: 14 },
  badgeXpPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeXpText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  badgeLocked: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#B2BEC3", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  modalInput: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 60, marginBottom: 20, gap: 8 },
  modalCurrency: { fontSize: 22, fontFamily: "Inter_400Regular" },
  modalInputText: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold" },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalCancelBtn: { flex: 1, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
