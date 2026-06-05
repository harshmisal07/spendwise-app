import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type PlanTier = "free" | "pro" | "premium";

export type PlanFeature =
  | "ai_coach"
  | "ai_chat"
  | "voice_input"
  | "csv_export"
  | "pdf_export"
  | "cloud_backup"
  | "unlimited_goals"
  | "unlimited_categories"
  | "advanced_analytics"
  | "multi_currency"
  | "achievements"
  | "challenges"
  | "notifications";

export type Plan = {
  tier: PlanTier;
  name: string;
  price: number;
  priceLabel: string;
  color: string;
  gradient: [string, string];
  features: string[];
  featureAccess: PlanFeature[];
  badge?: string;
};

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    priceLabel: "₹0 / month",
    color: "#B2BEC3",
    gradient: ["#636E72", "#B2BEC3"],
    badge: undefined,
    features: [
      "Track up to 50 transactions/month",
      "3 financial goals",
      "Basic analytics",
      "Manual CSV export",
      "INR currency only",
    ],
    featureAccess: ["csv_export", "achievements", "challenges", "notifications"],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 199,
    priceLabel: "₹199 / month",
    color: "#6C5CE7",
    gradient: ["#4834D4", "#6C5CE7"],
    badge: "Popular",
    features: [
      "Unlimited transactions",
      "Unlimited goals",
      "AI Finance Coach",
      "Voice input (Eng/Hindi/Marathi)",
      "PDF export",
      "Cloud backup & sync",
      "Multi-currency (INR/USD/EUR/GBP)",
      "Advanced analytics",
      "All Free features",
    ],
    featureAccess: [
      "ai_coach", "voice_input", "csv_export", "pdf_export",
      "cloud_backup", "unlimited_goals", "unlimited_categories",
      "advanced_analytics", "multi_currency", "achievements",
      "challenges", "notifications",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    price: 499,
    priceLabel: "₹499 / month",
    color: "#FDCB6E",
    gradient: ["#E17055", "#FDCB6E"],
    badge: "Best Value",
    features: [
      "Everything in Pro",
      "AI Chat with Gemini",
      "Personalized AI analysis",
      "Priority support",
      "Early access to new features",
      "Family sharing (up to 3 accounts)",
    ],
    featureAccess: [
      "ai_coach", "ai_chat", "voice_input", "csv_export", "pdf_export",
      "cloud_backup", "unlimited_goals", "unlimited_categories",
      "advanced_analytics", "multi_currency", "achievements",
      "challenges", "notifications",
    ],
  },
};

type PremiumContextType = {
  plan: PlanTier;
  planInfo: Plan;
  expiresAt: string | null;
  isLoading: boolean;
  hasFeature: (f: PlanFeature) => boolean;
  upgradeTo: (tier: PlanTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  daysLeft: number | null;
};

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);
const STORAGE_KEY = "@spendwise_premium";

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanTier>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setIsLoading(false); return; }
    loadPlan(user.id);
  }, [user?.id]);

  async function loadPlan(uid: string) {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${uid}`);
      if (raw) {
        const saved = JSON.parse(raw);
        const now = Date.now();
        if (saved.expiresAt && new Date(saved.expiresAt).getTime() < now) {
          setPlan("free");
          setExpiresAt(null);
        } else {
          setPlan(saved.plan ?? "free");
          setExpiresAt(saved.expiresAt ?? null);
        }
      }
    } catch {}
    setIsLoading(false);
  }

  async function savePlan(uid: string, tier: PlanTier, expires: string | null) {
    await AsyncStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify({ plan: tier, expiresAt: expires }));
  }

  const hasFeature = useCallback((f: PlanFeature): boolean => {
    return PLANS[plan].featureAccess.includes(f);
  }, [plan]);

  async function upgradeTo(tier: PlanTier) {
    if (!user?.id) return;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    const expiresStr = expiry.toISOString();
    setPlan(tier);
    setExpiresAt(expiresStr);
    await savePlan(user.id, tier, expiresStr);
  }

  async function cancelSubscription() {
    if (!user?.id) return;
    setPlan("free");
    setExpiresAt(null);
    await savePlan(user.id, "free", null);
  }

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <PremiumContext.Provider value={{ plan, planInfo: PLANS[plan], expiresAt, isLoading, hasFeature, upgradeTo, cancelSubscription, daysLeft }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
