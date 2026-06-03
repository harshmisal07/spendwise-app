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
import { useRegion } from "@/hooks/useRegion";

type Plan = "free" | "pro" | "premium";
type PayMethod = "upi" | "card" | null;

const PLAN_META = [
  {
    id: "free" as Plan,
    name: "Free",
    icon: "leaf" as const,
    color: "#B2BEC3",
    gradient: ["#636E72", "#B2BEC3"] as [string, string],
    priceIN: "₹0",
    priceINAlt: "$0",
    priceINT: "$0",
    priceINTAlt: "₹0",
    period: "/forever",
    features: ["Up to 50 transactions/mo", "Basic analytics", "2 categories", "Local storage"],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    icon: "star" as const,
    color: "#6C5CE7",
    gradient: ["#4834D4", "#6C5CE7"] as [string, string],
    priceIN: "₹99",
    priceINAlt: "~$1.20",
    priceINT: "$4.99",
    priceINTAlt: "~₹415",
    period: "/month",
    features: ["Unlimited transactions", "Full analytics + charts", "All 10 categories", "Budget alerts", "CSV export"],
    recommended: true,
  },
  {
    id: "premium" as Plan,
    name: "Premium",
    icon: "diamond" as const,
    color: "#FDCB6E",
    gradient: ["#E17055", "#FDCB6E"] as [string, string],
    priceIN: "₹199",
    priceINAlt: "~$2.40",
    priceINT: "$9.99",
    priceINTAlt: "~₹832",
    period: "/month",
    features: ["Everything in Pro", "AI insights", "Multiple accounts", "Cloud sync", "Priority support", "Custom categories"],
  },
];

const UPI_APPS = [
  { id: "googlepay", name: "Google Pay", icon: "logo-google" as const, color: "#4285F4" },
  { id: "phonepe", name: "PhonePe", icon: "phone-portrait" as const, color: "#5F259F" },
  { id: "paytm", name: "Paytm", icon: "wallet" as const, color: "#00BAF2" },
  { id: "bhim", name: "BHIM UPI", icon: "card" as const, color: "#0D4F8B" },
];

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isIndia, currencySymbol, setRegion, region } = useRegion();

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

  const plan = PLAN_META.find((p) => p.id === selectedPlan)!;
  const displayPrice = isIndia ? plan.priceIN : plan.priceINT;
  const altPrice = isIndia ? plan.priceINAlt : plan.priceINTAlt;

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
      Alert.alert("Free Plan", "You're already on the Free plan!");
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
      `Welcome to SpendWise ${plan.name}!\n\n${displayPrice}${plan.period} · ${isIndia ? "INR" : "USD"}\n\nAll premium features are now unlocked!`,
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
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Upgrade Plan</Text>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
              Unlock all premium features
            </Text>
          </View>
          {/* Region toggle */}
          <View style={[styles.regionToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => { setRegion("IN"); setPayMethod(null); Haptics.selectionAsync(); }}
              style={[styles.regionBtn, isIndia && { backgroundColor: "#6C5CE7" }]}
            >
              <Text style={[styles.regionBtnText, { color: isIndia ? "#fff" : colors.mutedForeground }]}>🇮🇳 INR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setRegion("INTL"); setPayMethod(null); Haptics.selectionAsync(); }}
              style={[styles.regionBtn, !isIndia && { backgroundColor: "#6C5CE7" }]}
            >
              <Text style={[styles.regionBtnText, { color: !isIndia ? "#fff" : colors.mutedForeground }]}>🌍 USD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Region info banner */}
        <View style={[styles.regionBanner, { backgroundColor: isIndia ? "#6C5CE710" : "#00B89410", borderColor: isIndia ? "#6C5CE730" : "#00B89430" }]}>
          <Ionicons name="location" size={14} color={isIndia ? "#6C5CE7" : "#00B894"} />
          <Text style={[styles.regionBannerText, { color: isIndia ? "#6C5CE7" : "#00B894" }]}>
            {isIndia
              ? "Indian pricing · Prices in INR · UPI payments available"
              : "International pricing · Prices in USD · Card payments accepted"}
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansGrid}>
          {PLAN_META.map((p) => {
            const price = isIndia ? p.priceIN : p.priceINT;
            const alt = isIndia ? p.priceINAlt : p.priceINTAlt;
            const isSelected = selectedPlan === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => { setSelectedPlan(p.id); Haptics.selectionAsync(); }}
                activeOpacity={0.85}
                style={[
                  styles.planCard,
                  {
                    borderColor: isSelected ? p.color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
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
                  <Ionicons name={p.icon} size={20} color="#fff" />
                </LinearGradient>
                <Text style={[styles.planName, { color: colors.foreground }]}>{p.name}</Text>
                <Text style={[styles.planPrice, { color: p.color }]}>{price}</Text>
                <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>{p.period}</Text>
                {p.id !== "free" && (
                  <Text style={[styles.planAlt, { color: colors.mutedForeground }]}>{alt}</Text>
                )}
                <View style={{ gap: 5, marginTop: 8 }}>
                  {p.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={13} color={p.color} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]} numberOfLines={1}>{f}</Text>
                    </View>
                  ))}
                </View>
                {isSelected && (
                  <View style={[styles.selectedCheck, { backgroundColor: p.color }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pricing comparison row */}
        {selectedPlan !== "free" && (
          <View style={[styles.compareRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.compareItem}>
              <View style={styles.compareFlag}><Text style={styles.compareFlagText}>🇮🇳</Text></View>
              <View>
                <Text style={[styles.comparePrice, { color: isIndia ? "#6C5CE7" : colors.mutedForeground, fontFamily: isIndia ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  {selectedPlan === "pro" ? "₹99" : "₹199"}<Text style={styles.comparePer}>/mo</Text>
                </Text>
                <Text style={[styles.compareLabel, { color: colors.mutedForeground }]}>India · INR</Text>
              </View>
              {isIndia && <Ionicons name="checkmark-circle" size={16} color="#6C5CE7" style={{ marginLeft: 4 }} />}
            </View>
            <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
            <View style={styles.compareItem}>
              <View style={styles.compareFlag}><Text style={styles.compareFlagText}>🌍</Text></View>
              <View>
                <Text style={[styles.comparePrice, { color: !isIndia ? "#6C5CE7" : colors.mutedForeground, fontFamily: !isIndia ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  {selectedPlan === "pro" ? "$4.99" : "$9.99"}<Text style={styles.comparePer}>/mo</Text>
                </Text>
                <Text style={[styles.compareLabel, { color: colors.mutedForeground }]}>International · USD</Text>
              </View>
              {!isIndia && <Ionicons name="checkmark-circle" size={16} color="#6C5CE7" style={{ marginLeft: 4 }} />}
            </View>
          </View>
        )}

        {selectedPlan !== "free" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Method</Text>

            {/* UPI — India only */}
            {isIndia && (
              <>
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
                    <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>Google Pay · PhonePe · Paytm · BHIM</Text>
                  </View>
                  <Ionicons
                    name={payMethod === "upi" ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={payMethod === "upi" ? "#6C5CE7" : colors.mutedForeground}
                  />
                </TouchableOpacity>

                {payMethod === "upi" && (
                  <View style={[styles.upiSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.upiAppsLabel, { color: colors.mutedForeground }]}>Choose UPI App</Text>
                    <View style={styles.upiAppsRow}>
                      {UPI_APPS.map((app) => (
                        <TouchableOpacity
                          key={app.id}
                          style={[styles.upiApp, { backgroundColor: app.color + "18", borderColor: app.color + "44" }]}
                          onPress={() => { Haptics.selectionAsync(); setUpiId(`yourname@${app.id}`); }}
                        >
                          <Ionicons name={app.icon} size={22} color={app.color} />
                          <Text style={[styles.upiAppName, { color: colors.foreground }]}>{app.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.upiLabel, { color: colors.mutedForeground }]}>Or enter UPI ID manually</Text>
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
                        placeholder="yourname@okicici"
                        placeholderTextColor={colors.mutedForeground}
                        value={upiId}
                        onChangeText={setUpiId}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField("upi")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    <Text style={[styles.upiNote, { color: colors.mutedForeground }]}>
                      Pay ₹{selectedPlan === "pro" ? "99" : "199"}/month · Recurring via UPI mandate
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Card — always available, primary for international */}
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
                <Text style={[styles.methodLabel, { color: colors.foreground }]}>
                  Credit / Debit Card{isIndia ? "" : "  ·  Recommended"}
                </Text>
                <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                  {isIndia ? "Visa · Mastercard · RuPay · Amex" : "Visa · Mastercard · Amex · Discover"}
                </Text>
              </View>
              <Ionicons
                name={payMethod === "card" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={payMethod === "card" ? "#00B894" : colors.mutedForeground}
              />
            </TouchableOpacity>

            {payMethod === "card" && (
              <View style={[styles.cardSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                  <Text style={styles.cardPreviewNumber}>{cardNumber || "•••• •••• •••• ••••"}</Text>
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
                <Text style={[styles.upiNote, { color: colors.mutedForeground }]}>
                  Charged {isIndia ? `₹${selectedPlan === "pro" ? "99" : "199"}` : `$${selectedPlan === "pro" ? "4.99" : "9.99"}`}/month · Secure 256-bit encryption
                </Text>
              </View>
            )}

            {/* Trust badges */}
            <View style={[styles.trustRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { icon: "shield-checkmark" as const, label: "SSL Secured" },
                { icon: "lock-closed" as const, label: "Encrypted" },
                { icon: "refresh-circle" as const, label: "Cancel Anytime" },
              ].map((t) => (
                <View key={t.label} style={styles.trustItem}>
                  <Ionicons name={t.icon} size={16} color="#00B894" />
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
              {selectedPlan === "free"
                ? "Continue Free"
                : `Subscribe · ${displayPrice}${plan.period}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {selectedPlan !== "free" && (
          <Text style={[styles.altPriceNote, { color: colors.mutedForeground }]}>
            {isIndia ? `Also available at $${selectedPlan === "pro" ? "4.99" : "9.99"}/mo for international users` : `Also available at ₹${selectedPlan === "pro" ? "99" : "199"}/mo for Indian users`}
          </Text>
        )}

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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 2 },
  pageSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  regionToggle: {
    flexDirection: "row", borderRadius: 12, padding: 3,
    borderWidth: 1, gap: 2,
  },
  regionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  regionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  regionBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, marginBottom: 16,
  },
  regionBannerText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  plansGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  planCard: {
    flex: 1, borderRadius: 20, padding: 12, position: "relative", overflow: "hidden",
  },
  recommendedBadge: {
    position: "absolute", top: 0, right: 0, left: 0, paddingVertical: 4, alignItems: "center",
  },
  recommendedText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  planIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8, marginTop: 12,
  },
  planName: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  planPrice: { fontSize: 19, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 2 },
  planAlt: { fontSize: 9, fontFamily: "Inter_400Regular", marginBottom: 2 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  featureText: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  selectedCheck: {
    position: "absolute", top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  compareRow: {
    flexDirection: "row", borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 20, alignItems: "center",
  },
  compareItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  compareFlag: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(108,92,231,0.08)" },
  compareFlagText: { fontSize: 18 },
  comparePrice: { fontSize: 18 },
  comparePer: { fontSize: 11, fontFamily: "Inter_400Regular" },
  compareLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  compareDivider: { width: 1, height: 40, marginHorizontal: 10 },
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
  upiNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 8, textAlign: "center" },
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
  altPriceNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
  disclaimer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 6 },
});
