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
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [sent, setSent] = useState(false);

  function handleReset() {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address");
      return;
    }
    // Simulate sending — in a real app this calls an API
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back */}
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
          {/* Icon */}
          <LinearGradient
            colors={["#FDCB6E", "#E17055"]}
            style={styles.iconBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="lock-open" size={36} color="#fff" />
          </LinearGradient>

          <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter the email address linked to your account and we'll send a reset link.
          </Text>

          {!sent ? (
            <>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.card,
                    borderColor: focused ? "#6C5CE7" : colors.border,
                    borderWidth: focused ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={focused ? "#6C5CE7" : colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
              </View>

              <TouchableOpacity onPress={handleReset} activeOpacity={0.85} style={{ marginTop: 16 }}>
                <LinearGradient
                  colors={["#FDCB6E", "#E17055"]}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.btnText}>Send Reset Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.successBox, { backgroundColor: "#00B89418", borderColor: "#00B894" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#00B894" />
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Email Sent!</Text>
              <Text style={[styles.successText, { color: colors.mutedForeground }]}>
                If an account exists for{" "}
                <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                  {email}
                </Text>
                , you'll receive a reset link shortly.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={[styles.backToLogin, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {!sent && (
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Remember your password? <Text style={{ color: "#6C5CE7", fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  content: { paddingHorizontal: 24, paddingTop: 16, alignItems: "center" },
  iconBox: {
    width: 90, height: 90, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#FDCB6E", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, height: 56,
    alignSelf: "stretch",
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: {
    borderRadius: 14, height: 56, alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 8,
    alignSelf: "stretch",
    shadowColor: "#E17055", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  successBox: {
    alignSelf: "stretch", borderRadius: 20, padding: 28,
    alignItems: "center", gap: 12, borderWidth: 1,
  },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  backToLogin: {
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  backToLoginText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cancelBtn: { marginTop: 24 },
  cancelText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
