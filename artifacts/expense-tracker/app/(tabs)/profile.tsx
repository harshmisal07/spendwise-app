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

type ThemeOption = "light" | "dark" | "system";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(user?.budgetLimit?.toString() ?? "2000");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 100;

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "ME";

  async function handleSaveUsername() {
    if (!newUsername.trim()) {
      Alert.alert("Invalid", "Username cannot be empty");
      return;
    }
    await updateUser({ username: newUsername.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingUsername(false);
  }

  async function handleSaveBudget() {
    const val = parseFloat(newBudget);
    if (isNaN(val) || val < 0) {
      Alert.alert("Invalid", "Please enter a valid budget amount");
      return;
    }
    await updateUser({ budgetLimit: val });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingBudget(false);
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const THEMES: { key: ThemeOption; label: string; icon: string }[] = [
    { key: "light", label: "Light", icon: "sunny" },
    { key: "dark", label: "Dark", icon: "moon" },
    { key: "system", label: "System", icon: "phone-portrait-outline" },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={[user?.avatarColor ?? colors.primary, "#A29BFE"]}
            style={styles.avatarLarge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{user?.username}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
        </View>

        {/* Username */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Username</Text>
          </View>
          {editingUsername ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoFocus
                onSubmitEditing={handleSaveUsername}
              />
              <TouchableOpacity onPress={handleSaveUsername} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingUsername(false); setNewUsername(user?.username ?? ""); }} style={[styles.cancelBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>{user?.username}</Text>
              <TouchableOpacity onPress={() => setEditingUsername(true)}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Budget */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Budget Limit</Text>
          </View>
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
              <TouchableOpacity onPress={handleSaveBudget} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingBudget(false); setNewBudget(user?.budgetLimit?.toString() ?? "2000"); }} style={[styles.cancelBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.foreground }]}>${user?.budgetLimit?.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => setEditingBudget(true)}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            You'll be warned when expenses exceed this limit
          </Text>
        </View>

        {/* Theme */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>
          </View>
          <View style={styles.themeRow}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => {
                  setTheme(t.key);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.themeBtn,
                  {
                    backgroundColor: theme === t.key ? colors.primary + "20" : colors.muted,
                    borderColor: theme === t.key ? colors.primary : "transparent",
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={20}
                  color={theme === t.key ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.themeBtnText,
                    { color: theme === t.key ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Storage</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>Local Device</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 20 },
  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold" },
  displayName: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  email: { fontSize: 14, fontFamily: "Inter_400Regular" },
  section: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cancelBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  valueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  value: { fontSize: 16, fontFamily: "Inter_500Medium" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  themeRow: { flexDirection: "row", gap: 8 },
  themeBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  themeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 8 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
