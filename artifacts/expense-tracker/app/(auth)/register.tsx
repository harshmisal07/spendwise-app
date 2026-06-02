import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Failed", err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{
    key: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    icon: string;
    secure?: boolean;
    keyboard?: "default" | "email-address";
    showToggle?: boolean;
  }> = [
    { key: "name", placeholder: "Full name", value: username, onChange: setUsername, icon: "person-outline" },
    { key: "email", placeholder: "Email address", value: email, onChange: setEmail, icon: "mail-outline", keyboard: "email-address" },
    { key: "password", placeholder: "Password", value: password, onChange: setPassword, icon: "lock-closed-outline", secure: !showPassword, showToggle: true },
    { key: "confirm", placeholder: "Confirm password", value: confirmPassword, onChange: setConfirmPassword, icon: "shield-checkmark-outline", secure: !showPassword },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#00B894", "#00CEC9", "#74B9FF"]}
        style={[styles.hero, { paddingTop: insets.top + 28 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoWrap}>
          <Ionicons name="person-add" size={34} color="#fff" />
        </View>
        <Text style={styles.appName}>Create Account</Text>
        <Text style={styles.tagline}>Join SpendWise today</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Get started 🚀</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Create your free account
          </Text>

          <View style={{ gap: 12, marginBottom: 8 }}>
            {fields.map((f) => (
              <View
                key={f.key}
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.card,
                    borderColor: focusedField === f.key ? "#6C5CE7" : colors.border,
                    borderWidth: focusedField === f.key ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={f.icon as any}
                  size={18}
                  color={focusedField === f.key ? "#6C5CE7" : colors.mutedForeground}
                />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={f.value}
                  onChangeText={f.onChange}
                  secureTextEntry={f.secure}
                  keyboardType={f.keyboard ?? "default"}
                  autoCapitalize={f.keyboard === "email-address" ? "none" : f.key === "name" ? "words" : "none"}
                  autoCorrect={false}
                  onFocus={() => setFocusedField(f.key)}
                  onBlur={() => setFocusedField(null)}
                />
                {f.showToggle ? (
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Password must be at least 6 characters
          </Text>

          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={["#00B894", "#00CEC9"]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>{loading ? "Creating account…" : "Create Account"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={[styles.footerLink, { color: "#6C5CE7" }]}>Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 36, alignItems: "center" },
  logoWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  form: { padding: 24, paddingTop: 24 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingHorizontal: 14, height: 54,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  btn: {
    borderRadius: 14, height: 56, alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 8,
    shadowColor: "#00B894", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
