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
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword, emailExists } = useAuth();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleCheckEmail() {
    const trimmed = email.trim();
    if (!trimmed) { Alert.alert("Required", "Please enter your email address"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { Alert.alert("Invalid Email", "Please enter a valid email address"); return; }
    setLoading(true);
    try {
      const exists = await emailExists(trimmed);
      if (!exists) { Alert.alert("Not Found", "No account found with this email address"); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("reset");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim()) { Alert.alert("Required", "Please enter a new password"); return; }
    if (newPassword.length < 6) { Alert.alert("Too Short", "Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Mismatch", "Passwords do not match"); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim(), newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Password Reset",
        "Your password has been updated. Please sign in with your new password.",
        [{ text: "Sign In", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#FDCB6E", "#E17055"]}
            style={styles.iconBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="lock-open" size={36} color="#fff" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {step === "email" ? "Reset Password" : "New Password"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === "email"
              ? "Enter the email linked to your account to continue."
              : `Creating new password for ${email}`}
          </Text>

          {step === "email" ? (
            <>
              <View style={[styles.inputWrap, {
                backgroundColor: colors.card,
                borderColor: focused === "email" ? "#6C5CE7" : colors.border,
                borderWidth: focused === "email" ? 1.5 : 1,
              }]}>
                <Ionicons name="mail-outline" size={18} color={focused === "email" ? "#6C5CE7" : colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <TouchableOpacity onPress={handleCheckEmail} disabled={loading} activeOpacity={0.85} style={{ marginTop: 16, alignSelf: "stretch" }}>
                <LinearGradient colors={["#FDCB6E", "#E17055"]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnText}>{loading ? "Verifying…" : "Continue"}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[
                { key: "new", placeholder: "New password", value: newPassword, onChange: setNewPassword },
                { key: "confirm", placeholder: "Confirm new password", value: confirmPassword, onChange: setConfirmPassword },
              ].map((f) => (
                <View key={f.key} style={[styles.inputWrap, {
                  backgroundColor: colors.card,
                  borderColor: focused === f.key ? "#6C5CE7" : colors.border,
                  borderWidth: focused === f.key ? 1.5 : 1,
                  marginBottom: 12,
                }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focused === f.key ? "#6C5CE7" : colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={f.value}
                    onChangeText={f.onChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocused(f.key)}
                    onBlur={() => setFocused(null)}
                  />
                  {f.key === "new" && (
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={handleResetPassword} disabled={loading} activeOpacity={0.85} style={{ marginTop: 8, alignSelf: "stretch" }}>
                <LinearGradient colors={["#00B894", "#00CEC9"]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>{loading ? "Saving…" : "Reset Password"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.cancelBtn}>
            <Ionicons name="arrow-back-outline" size={14} color="#6C5CE7" />
            <Text style={[styles.cancelText, { color: "#6C5CE7" }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, alignItems: "center" },
  iconBox: {
    width: 90, height: 90, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 24,
    shadowColor: "#FDCB6E", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, height: 56, alignSelf: "stretch", marginBottom: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: {
    borderRadius: 14, height: 56, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8, alignSelf: "stretch",
    shadowColor: "#E17055", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 28 },
  cancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
