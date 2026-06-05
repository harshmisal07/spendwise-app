import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionContext";

export type ChallengeStatus = "available" | "active" | "completed" | "failed";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  durationDays: number;
  xpReward: number;
  type: "no_spend" | "daily_save" | "budget_keep" | "track_daily" | "savings_rate";
  targetValue?: number;
};

export type ActiveChallenge = {
  challengeId: string;
  startedAt: string;
  status: ChallengeStatus;
  completedAt?: string;
};

type ChallengesContextType = {
  challenges: Challenge[];
  activeChallenges: ActiveChallenge[];
  joinChallenge: (id: string) => Promise<void>;
  leaveChallenge: (id: string) => Promise<void>;
  getStatus: (id: string) => ChallengeStatus;
  getProgress: (id: string) => number;
  getActiveDays: (id: string) => number;
};

const CHALLENGE_DEFS: Challenge[] = [
  {
    id: "no_spend_7",
    title: "7-Day No-Spend",
    description: "Avoid entertainment & shopping expenses for 7 days",
    icon: "ban",
    color: "#E17055",
    durationDays: 7,
    xpReward: 50,
    type: "no_spend",
  },
  {
    id: "track_7",
    title: "7-Day Tracker",
    description: "Log at least one transaction every day for 7 days",
    icon: "create",
    color: "#74B9FF",
    durationDays: 7,
    xpReward: 40,
    type: "track_daily",
  },
  {
    id: "budget_30",
    title: "30-Day Budget Challenge",
    description: "Stay within your monthly budget for 30 days",
    icon: "shield",
    color: "#00B894",
    durationDays: 30,
    xpReward: 120,
    type: "budget_keep",
  },
  {
    id: "no_spend_30",
    title: "30-Day Frugal Life",
    description: "Reduce your total expenses by 20% compared to last month",
    icon: "leaf",
    color: "#55EFC4",
    durationDays: 30,
    xpReward: 150,
    type: "savings_rate",
    targetValue: 20,
  },
  {
    id: "track_30",
    title: "Monthly Habit",
    description: "Log transactions every day for 30 days straight",
    icon: "calendar",
    color: "#A29BFE",
    durationDays: 30,
    xpReward: 200,
    type: "track_daily",
  },
  {
    id: "weekend_save",
    title: "Weekend Warrior",
    description: "Avoid non-essential spending this weekend",
    icon: "sunny",
    color: "#FDCB6E",
    durationDays: 2,
    xpReward: 25,
    type: "no_spend",
  },
];

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

function storageKey(userId: string) {
  return `@spendwise_challenges_${userId}`;
}

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);

  const load = useCallback(async () => {
    if (!user) { setActiveChallenges([]); return; }
    try {
      const raw = await AsyncStorage.getItem(storageKey(user.id));
      setActiveChallenges(raw ? JSON.parse(raw) : []);
    } catch { setActiveChallenges([]); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function persist(updated: ActiveChallenge[]) {
    if (!user) return;
    await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(updated));
    setActiveChallenges(updated);
  }

  async function joinChallenge(id: string) {
    const existing = activeChallenges.find((ac) => ac.challengeId === id);
    if (existing) return;
    await persist([...activeChallenges, { challengeId: id, startedAt: new Date().toISOString(), status: "active" }]);
  }

  async function leaveChallenge(id: string) {
    await persist(activeChallenges.filter((ac) => ac.challengeId !== id));
  }

  function getStatus(id: string): ChallengeStatus {
    const ac = activeChallenges.find((a) => a.challengeId === id);
    if (!ac) return "available";
    const challenge = CHALLENGE_DEFS.find((c) => c.id === id);
    if (!challenge) return ac.status;
    const elapsed = (Date.now() - new Date(ac.startedAt).getTime()) / 86400000;
    const progress = getProgress(id);
    if (elapsed >= challenge.durationDays) {
      return progress >= 100 ? "completed" : "failed";
    }
    return "active";
  }

  function getActiveDays(id: string): number {
    const ac = activeChallenges.find((a) => a.challengeId === id);
    if (!ac) return 0;
    return Math.floor((Date.now() - new Date(ac.startedAt).getTime()) / 86400000);
  }

  function getProgress(id: string): number {
    const ac = activeChallenges.find((a) => a.challengeId === id);
    if (!ac) return 0;
    const challenge = CHALLENGE_DEFS.find((c) => c.id === id);
    if (!challenge) return 0;

    const startDate = new Date(ac.startedAt);
    const txInPeriod = transactions.filter((t) => new Date(t.date + "T12:00:00") >= startDate);

    if (challenge.type === "no_spend") {
      const noSpend = !txInPeriod.some((t) =>
        t.type === "expense" && ["entertainment", "shopping"].includes(t.category)
      );
      const elapsed = Math.min((Date.now() - startDate.getTime()) / 86400000, challenge.durationDays);
      return noSpend ? (elapsed / challenge.durationDays) * 100 : 0;
    }

    if (challenge.type === "track_daily") {
      const daysWithTx = new Set(txInPeriod.map((t) => t.date)).size;
      const elapsed = Math.min(Math.ceil((Date.now() - startDate.getTime()) / 86400000), challenge.durationDays);
      return elapsed > 0 ? Math.min((daysWithTx / elapsed) * 100, 100) : 0;
    }

    if (challenge.type === "budget_keep") {
      const elapsed = (Date.now() - startDate.getTime()) / 86400000;
      return Math.min((elapsed / challenge.durationDays) * 100, 100);
    }

    if (challenge.type === "savings_rate") {
      const totalExp = txInPeriod.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const totalInc = txInPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      if (totalInc <= 0) return 0;
      const rate = ((totalInc - totalExp) / totalInc) * 100;
      const target = challenge.targetValue ?? 20;
      return Math.min((rate / target) * 100, 100);
    }

    return 0;
  }

  const value = useMemo<ChallengesContextType>(() => ({
    challenges: CHALLENGE_DEFS,
    activeChallenges,
    joinChallenge,
    leaveChallenge,
    getStatus,
    getProgress,
    getActiveDays,
  }), [activeChallenges, transactions]);

  return <ChallengesContext.Provider value={value}>{children}</ChallengesContext.Provider>;
}

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
  return ctx;
}
