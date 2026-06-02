import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useTransactions } from "@/context/TransactionContext";

type ThemeOption = "light" | "dark" | "system";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { transactions, totalIncome, totalExpenses } = useTransactions();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(user?.budgetLimit?.toString() ?? "2000");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";

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
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all password fields"); return;
    }
    if (currentPassword !== user?.password) {
      Alert.alert("Incorrect Password", "Current password is incorrect"); return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "New password must be at least 6 characters"); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match"); return;
    }
    await updateUser({ password: newPassword });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Password changed successfully");
    setChangingPassword(false);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => { await logout(); router.replace("/(auth)/login"); },
      },
    ]);
  }

  const THEMES: { key: ThemeOption; label: string; icon: string }[] = [
    { key: "light", label: "Light", icon: "sunny" },
    { key: "dark", label: "Dark", icon: "moon" },
    { key: "system", label: "Auto", icon: "phone-portrait-outline" },
  ];

  function Section({ children }: { children: React.ReactNode }) {
    return (
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    );
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

        {/* Avatar Header */}
        <LinearGradient
          colors={["#4834D4", "#6C5CE7", "#A29BFE"]}
          style={styles.avatarCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
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
            { label: "Income", value: `$${totalIncome.toFixed(0)}`, color: "#00B894" },
            { label: "Expenses", value: `$${totalExpenses.toFixed(0)}`, color: "#FF6B6B" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Username */}
        <Section>
          <SectionRow icon="person-outline" title="Username" />
          {editingUsername ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoFocus
                onSubmitEditing={handleSaveUsername}
              />
              <TouchableOpacity onPress={handleSaveUsername} style={[styles.actionBtn, { backgroundColor: "#6C5CE7" }]}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingUsername(false); setNewUsername(user?.username ?? ""); }} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>{user?.username}</Text>
              <TouchableOpacity onPress={() => setEditingUsername(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* Budget */}
        <Section>
          <SectionRow icon="wallet-outline" title="Monthly Budget" />
          {editingBudget ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newBudget}
                onChangeText={setNewBudget}
                keyboardType="decimal-pad"
                autoFocus
                onSubmitEditing={handleSaveBudget}
              />
              <TouchableOpacity onPress={handleSaveBudget} style={[styles.actionBtn, { backgroundColor: "#6C5CE7" }]}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingBudget(false); setNewBudget(user?.budgetLimit?.toString() ?? "2000"); }} style={[styles.actionBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>${user?.budgetLimit?.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => setEditingBudget(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            You'll be notified when expenses exceed this limit
          </Text>
        </Section>

        {/* Change Password */}
        <Section>
          <SectionRow icon="lock-closed-outline" title="Change Password">
            <TouchableOpacity
              onPress={() => setChangingPassword((v) => !v)}
              style={[styles.togglePassBtn, { backgroundColor: changingPassword ? "#FF6B6B18" : "#6C5CE718" }]}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text style={[styles.togglePassText, { color: changingPassword ? "#FF6B6B" : "#6C5CE7" }]}>
                {changingPassword ? "Cancel" : "Change"}
              </Text>
            </TouchableOpacity>
          </SectionRow>
          {changingPassword && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {[
                { key: "current", label: "Current password", value: currentPassword, setter: setCurrentPassword },
                { key: "new", label: "New password", value: newPassword, setter: setNewPassword },
                { key: "confirm", label: "Confirm new password", value: confirmPassword, setter: setConfirmPassword },
              ].map((f) => (
                <View key={f.key} style={[styles.passInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.passInputText, { color: colors.foreground }]}
                    placeholder={f.label}
                    placeholderTextColor={colors.mutedForeground}
                    value={f.value}
                    onChangeText={f.setter}
                    secureTextEntry={!showPasswords}
                    autoCapitalize="none"
                  />
                </View>
              ))}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity onPress={() => setShowPasswords((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
                  <Text style={[{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }]}>
                    {showPasswords ? "Hide passwords" : "Show passwords"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={[styles.savePassBtn, { backgroundColor: "#6C5CE7" }]}
              >
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
              <TouchableOpacity
                key={t.key}
                onPress={() => { setTheme(t.key); Haptics.selectionAsync(); }}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme === t.key ? "#6C5CE720" : colors.muted,
                    borderColor: theme === t.key ? "#6C5CE7" : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Ionicons name={t.icon as any} size={20} color={theme === t.key ? "#6C5CE7" : colors.mutedForeground} />
                <Text style={[styles.themeBtnText, { color: theme === t.key ? "#6C5CE7" : colors.mutedForeground }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* App Info */}
        <Section>
          <SectionRow icon="information-circle-outline" title="App Info" />
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Storage", value: "Local Device" },
            { label: "Build", value: "Production" },
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

        {/* Upgrade CTA */}
        <TouchableOpacity onPress={() => router.push("/(tabs)/payment")} activeOpacity={0.85}>
          <LinearGradient
            colors={["#4834D4", "#6C5CE7"]}
            style={styles.upgradeBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="star" size={20} color="#FDCB6E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSub}>Unlock unlimited transactions & insights</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: "#FF6B6B15", borderColor: "#FF6B6B40" }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={[styles.logoutText, { color: "#FF6B6B" }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 16 },
  avatarCard: {
    borderRadius: 20, padding: 20, flexDirection: "row",
    alignItems: "center", gap: 16, marginBottom: 14,
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  avatarName: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  avatarEmail: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  memberText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    borderWidth: 1, alignItems: "center",
  },
  statValue: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1, paddingHorizontal: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  actionBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  value: { fontSize: 16, fontFamily: "Inter_500Medium" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  togglePassBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  togglePassText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  passInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 48,
  },
  passInputText: { fontSize: 15, fontFamily: "Inter_400Regular", height: "100%" },
  savePassBtn: {
    borderRadius: 12, height: 46,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  savePassText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12,
    alignItems: "center", gap: 6,
  },
  themeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 2 },
  upgradeBanner: {
    borderRadius: 16, padding: 16, flexDirection: "row",
    alignItems: "center", gap: 12, marginBottom: 12,
  },
  upgradeTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  upgradeSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 16, padding: 16, borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
