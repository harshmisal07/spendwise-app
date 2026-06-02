import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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

type Plan = "free" | "pro" | "premium";
type PayMethod = "upi" | "card" | null;

const PLANS = [
  {
    id: "free" as Plan,
    name: "Free",
    price: "$0",
    period: "/forever",
    color: "#B2BEC3",
    gradient: ["#636E72", "#B2BEC3"] as [string, string],
    features: ["Up to 50 transactions/mo", "Basic analytics", "2 categories", "Local storage"],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: "$4.99",
    period: "/month",
    color: "#6C5CE7",
    gradient: ["#4834D4", "#6C5CE7"] as [string, string],
    features: ["Unlimited transactions", "Full analytics + charts", "All 10 categories", "Budget alerts", "CSV export"],
    recommended: true,
  },
  {
    id: "premium" as Plan,
    name: "Premium",
    price: "$9.99",
    period: "/month",
    color: "#FDCB6E",
    gradient: ["#E17055", "#FDCB6E"] as [string, string],
    features: ["Everything in Pro", "AI spending insights", "Multiple accounts", "Cloud sync", "Priority support", "Custom categories"],
  },
];

const UPI_APPS = [
  { id: "googlepay", name: "Google Pay", icon: "logo-google", color: "#4285F4" },
  { id: "phonepe", name: "PhonePe", icon: "phone-portrait", color: "#5F259F" },
  { id: "paytm", name: "Paytm", icon: "wallet", color: "#00BAF2" },
  { id: "bhim", name: "BHIM UPI", icon: "card", color: "#0D4F8B" },
];

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 64 : 100;

  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro");
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  function formatCard(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function handleSubscribe() {
    if (selectedPlan === "free") {
      Alert.alert("Free Plan", "You're already on the Free plan. No payment needed!");
      return;
    }
    if (!payMethod) {
      Alert.alert("Select Payment", "Please choose a payment method");
      return;
    }
    if (payMethod === "upi" && !upiId.trim()) {
      Alert.alert("UPI ID Required", "Please enter your UPI ID");
      return;
    }
    if (payMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) {
        Alert.alert("Invalid Card", "Please enter a valid 16-digit card number");
        return;
      }
      if (!cardExpiry || !cardCvv || !cardName) {
        Alert.alert("Missing Details", "Please fill in all card details");
        return;
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "🎉 Subscription Activated!",
      `Welcome to SpendWise ${plan.name}! Your subscription for ${plan.price}${plan.period} is now active. Enjoy all premium features!`,
      [{ text: "Awesome!", style: "default" }]
    );
  }

  function inputStyle(key: string) {
    return [
      styles.cardInput,
      {
        backgroundColor: colors.card,
        color: colors.foreground,
        borderColor: focusedField === key ? "#6C5CE7" : colors.border,
        borderWidth: focusedField === key ? 1.5 : 1,
      },
    ];
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Upgrade Plan</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Unlock all premium features
        </Text>

        {/* Plans */}
        <View style={styles.plansGrid}>
          {PLANS.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => { setSelectedPlan(p.id); Haptics.selectionAsync(); }}
              activeOpacity={0.85}
              style={[
                styles.planCard,
                {
                  borderColor: selectedPlan === p.id ? p.color : colors.border,
                  borderWidth: selectedPlan === p.id ? 2 : 1,
                  backgroundColor: colors.card,
                },
              ]}
            >
              {p.recommended && (
                <LinearGradient colors={p.gradient} style={styles.recommendedBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.recommendedText}>POPULAR</Text>
                </LinearGradient>
              )}
              <LinearGradient colors={p.gradient} style={styles.planIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons
                  name={p.id === "free" ? "leaf" : p.id === "pro" ? "star" : "diamond"}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
              <Text style={[styles.planName, { color: colors.foreground }]}>{p.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={[styles.planPrice, { color: p.color }]}>{p.price}</Text>
                <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>{p.period}</Text>
              </View>
              <View style={{ gap: 6, marginTop: 8 }}>
                {p.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={14} color={p.color} />
                    <Text style={[styles.featureText, { color: colors.mutedForeground }]} numberOfLines={1}>{f}</Text>
                  </View>
                ))}
              </View>
              {selectedPlan === p.id && (
                <View style={[styles.selectedCheck, { backgroundColor: p.color }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedPlan !== "free" && (
          <>
            {/* Payment Methods */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>

            {/* UPI */}
            <TouchableOpacity
              onPress={() => { setPayMethod("upi"); Haptics.selectionAsync(); }}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.card,
                  borderColor: payMethod === "upi" ? "#6C5CE7" : colors.border,
                  borderWidth: payMethod === "upi" ? 2 : 1,
                },
              ]}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: "#6C5CE722" }]}>
                <Ionicons name="qr-code" size={20} color="#6C5CE7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, { color: colors.foreground }]}>UPI Payment</Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>Pay instantly with UPI apps</Text>
              </View>
              <Ionicons
                name={payMethod === "upi" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={payMethod === "upi" ? "#6C5CE7" : colors.mutedForeground}
              />
            </TouchableOpacity>

            {payMethod === "upi" && (
              <View style={[styles.upiSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* UPI Apps */}
                <Text style={[styles.upiAppsLabel, { color: colors.mutedForeground }]}>Choose UPI App</Text>
                <View style={styles.upiAppsRow}>
                  {UPI_APPS.map((app) => (
                    <TouchableOpacity
                      key={app.id}
                      style={[styles.upiApp, { backgroundColor: app.color + "18", borderColor: app.color + "44" }]}
                      onPress={() => { Haptics.selectionAsync(); setUpiId(`yourname@${app.id}`); }}
                    >
                      <Ionicons name={app.icon as any} size={22} color={app.color} />
                      <Text style={[styles.upiAppName, { color: colors.foreground }]}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* UPI ID input */}
                <Text style={[styles.upiLabel, { color: colors.mutedForeground }]}>Or enter UPI ID</Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: colors.background,
                      borderColor: focusedField === "upi" ? "#6C5CE7" : colors.border,
                      borderWidth: focusedField === "upi" ? 1.5 : 1,
                    },
                  ]}
                >
                  <Ionicons name="at" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="yourname@bank"
                    placeholderTextColor={colors.mutedForeground}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("upi")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* Credit/Debit Card */}
            <TouchableOpacity
              onPress={() => { setPayMethod("card"); Haptics.selectionAsync(); }}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.card,
                  borderColor: payMethod === "card" ? "#00B894" : colors.border,
                  borderWidth: payMethod === "card" ? 2 : 1,
                },
              ]}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: "#00B89422" }]}>
                <Ionicons name="card" size={20} color="#00B894" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.methodLabel, { color: colors.foreground }]}>Credit / Debit Card</Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>Visa, Mastercard, RuPay</Text>
              </View>
              <Ionicons
                name={payMethod === "card" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={payMethod === "card" ? "#00B894" : colors.mutedForeground}
              />
            </TouchableOpacity>

            {payMethod === "card" && (
              <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Card preview */}
                <LinearGradient
                  colors={["#4834D4", "#6C5CE7", "#A29BFE"]}
                  style={styles.cardPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardPreviewTop}>
                    <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.cardPreviewBank}>SpendWise</Text>
                  </View>
                  <Text style={styles.cardPreviewNumber}>
                    {cardNumber || "•••• •••• •••• ••••"}
                  </Text>
                  <View style={styles.cardPreviewBottom}>
                    <View>
                      <Text style={styles.cardPreviewLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardPreviewValue}>{cardName || "YOUR NAME"}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                      <Text style={styles.cardPreviewValue}>{cardExpiry || "MM/YY"}</Text>
                    </View>
                    <Ionicons name="logo-usd" size={24} color="rgba(255,255,255,0.5)" />
                  </View>
                </LinearGradient>

                {/* Card fields */}
                <TextInput
                  style={inputStyle("cardName")}
                  placeholder="Card holder name"
                  placeholderTextColor={colors.mutedForeground}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField("cardName")}
                  onBlur={() => setFocusedField(null)}
                />
                <TextInput
                  style={inputStyle("cardNumber")}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.mutedForeground}
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCard(t))}
                  keyboardType="number-pad"
                  maxLength={19}
                  onFocus={() => setFocusedField("cardNumber")}
                  onBlur={() => setFocusedField(null)}
                />
                <View style={styles.cardRow}>
                  <TextInput
                    style={[inputStyle("expiry"), { flex: 1 }]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.mutedForeground}
                    value={cardExpiry}
                    onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                    keyboardType="number-pad"
                    maxLength={5}
                    onFocus={() => setFocusedField("expiry")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TextInput
                    style={[inputStyle("cvv"), { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor={colors.mutedForeground}
                    value={cardCvv}
                    onChangeText={(t) => setCardCvv(t.replace(/\D/g, "").slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                    onFocus={() => setFocusedField("cvv")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            )}

            {/* Trust badges */}
            <View style={[styles.trustRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "shield-checkmark", label: "SSL Secured" },
                { icon: "lock-closed", label: "Encrypted" },
                { icon: "refresh-circle", label: "Cancel Anytime" },
              ].map((t) => (
                <View key={t.label} style={styles.trustItem}>
                  <Ionicons name={t.icon as any} size={16} color="#00B894" />
                  <Text style={[styles.trustLabel, { color: colors.mutedForeground }]}>{t.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Subscribe button */}
        <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.85}>
          <LinearGradient
            colors={plan.gradient}
            style={styles.subscribeBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name={selectedPlan === "free" ? "checkmark-circle" : "card"}
              size={22}
              color="#fff"
            />
            <Text style={styles.subscribeBtnText}>
              {selectedPlan === "free" ? "Continue Free" : `Subscribe · ${plan.price}${plan.period}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          {selectedPlan !== "free"
            ? "Cancel anytime. No hidden fees. Payments processed securely."
            : "Upgrade anytime to unlock premium features."}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pageSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  plansGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  planCard: {
    flex: 1, borderRadius: 20, padding: 14, position: "relative",
    overflow: "hidden",
  },
  recommendedBadge: {
    position: "absolute", top: 0, right: 0, left: 0,
    paddingVertical: 4, alignItems: "center",
  },
  recommendedText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  planIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8, marginTop: 12,
  },
  planName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  planPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 11, fontFamily: "Inter_400Regular" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  featureText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  selectedCheck: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 12 },
  methodCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 10,
  },
  methodIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  methodLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  methodSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  upiSection: {
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, marginTop: -4,
  },
  upiAppsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 10 },
  upiAppsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  upiApp: {
    flex: 1, borderRadius: 12, padding: 10,
    alignItems: "center", gap: 4, borderWidth: 1,
  },
  upiAppName: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center" },
  upiLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  cardSection: {
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, marginTop: -4, gap: 10,
  },
  cardPreview: {
    borderRadius: 16, padding: 20, marginBottom: 4,
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  cardPreviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardPreviewBank: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontFamily: "Inter_700Bold" },
  cardPreviewNumber: { color: "#fff", fontSize: 18, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 20 },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardPreviewLabel: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 1 },
  cardPreviewValue: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  cardInput: {
    borderRadius: 12, paddingHorizontal: 14, height: 50,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  cardRow: { flexDirection: "row", gap: 10 },
  trustRow: {
    flexDirection: "row", borderRadius: 14, padding: 14,
    justifyContent: "space-around", borderWidth: 1, marginBottom: 20, marginTop: 4,
  },
  trustItem: { alignItems: "center", gap: 4 },
  trustLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  subscribeBtn: {
    borderRadius: 16, height: 58, alignItems: "center",
    justifyContent: "center", flexDirection: "row", gap: 10,
    shadowColor: "#6C5CE7", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  subscribeBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 12 },
});
