import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionContext";
import { useGoals } from "./GoalsContext";

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  xp: number;
  earned: boolean;
  earnedAt?: string;
};

export type AchievementsContextType = {
  badges: Badge[];
  xp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
  earnedCount: number;
  totalCount: number;
};

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

const LEVEL_TITLES = [
  { min: 0,    title: "Beginner",        color: "#B2BEC3" },
  { min: 100,  title: "Tracker",         color: "#74B9FF" },
  { min: 300,  title: "Saver",           color: "#00B894" },
  { min: 600,  title: "Smart Spender",   color: "#A29BFE" },
  { min: 1000, title: "Budget Master",   color: "#FDCB6E" },
  { min: 1500, title: "Finance Pro",     color: "#6C5CE7" },
  { min: 2500, title: "Wealth Builder",  color: "#FF6B6B" },
  { min: 4000, title: "Financial Guru",  color: "#FD79A8" },
];

function computeLevel(xp: number) {
  let current = LEVEL_TITLES[0];
  let next = LEVEL_TITLES[1];
  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TITLES[i].min) {
      current = LEVEL_TITLES[i];
      next = LEVEL_TITLES[i + 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1];
      break;
    }
  }
  const levelIndex = LEVEL_TITLES.indexOf(current) + 1;
  const xpInLevel = xp - current.min;
  const xpNeeded = next.min - current.min;
  return {
    level: levelIndex,
    levelTitle: current.title,
    xpToNextLevel: Math.max(next.min - xp, 0),
    xpProgress: next === current ? 100 : Math.min((xpInLevel / xpNeeded) * 100, 100),
  };
}

function storageKey(userId: string) {
  return `@spendwise_achievements_${userId}`;
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { transactions, totalIncome, totalExpenses, balance, budgetPercent } = useTransactions();
  const { goals } = useGoals();
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [earnedDates, setEarnedDates] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const raw = await AsyncStorage.getItem(storageKey(user.id));
      if (raw) {
        const data = JSON.parse(raw);
        setEarnedIds(data.ids ?? []);
        setEarnedDates(data.dates ?? {});
      }
    } catch {}
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const allBadgeDefs: Omit<Badge, "earned" | "earnedAt">[] = [
    { id: "first_transaction", title: "First Step",       description: "Add your first transaction",         icon: "footsteps",        color: "#74B9FF", xp: 20  },
    { id: "tx_10",             title: "On a Roll",        description: "Record 10 transactions",             icon: "list",             color: "#A29BFE", xp: 30  },
    { id: "tx_50",             title: "Dedicated Tracker",description: "Record 50 transactions",             icon: "stats-chart",      color: "#6C5CE7", xp: 75  },
    { id: "tx_100",            title: "Century Club",     description: "Record 100 transactions",            icon: "trophy",           color: "#FDCB6E", xp: 150 },
    { id: "first_goal",        title: "Dream Starter",    description: "Create your first savings goal",     icon: "flag",             color: "#00B894", xp: 25  },
    { id: "goal_complete",     title: "Goal Achiever",    description: "Complete a savings goal",            icon: "checkmark-circle", color: "#00B894", xp: 100 },
    { id: "goals_3",           title: "Goal Setter",      description: "Have 3 active savings goals",        icon: "star",             color: "#FDCB6E", xp: 60  },
    { id: "savings_1k",        title: "First ₹1K Saved",  description: "Accumulate ₹1,000 in savings",      icon: "cash",             color: "#00CEC9", xp: 40  },
    { id: "savings_10k",       title: "Big Saver",        description: "Accumulate ₹10,000 in savings",     icon: "wallet",           color: "#6C5CE7", xp: 100 },
    { id: "budget_ok",         title: "Budget Keeper",    description: "Stay within monthly budget",         icon: "shield-checkmark", color: "#00B894", xp: 50  },
    { id: "income_added",      title: "Income Tracker",   description: "Add at least one income entry",      icon: "arrow-up-circle",  color: "#00B894", xp: 15  },
    { id: "categories_5",      title: "Category Explorer",description: "Use 5 different categories",         icon: "grid",             color: "#A29BFE", xp: 35  },
    { id: "positive_balance",  title: "In the Green",     description: "Maintain a positive balance",        icon: "trending-up",      color: "#00B894", xp: 30  },
    { id: "savings_rate_20",   title: "Savings Champion", description: "Achieve 20%+ savings rate",          icon: "rocket",           color: "#FD79A8", xp: 80  },
  ];

  const badges: Badge[] = useMemo(() => {
    const expenseCount   = transactions.filter((t) => t.type === "expense").length;
    const incomeCount    = transactions.filter((t) => t.type === "income").length;
    const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length;
    const uniqueCats     = new Set(transactions.map((t) => t.category)).size;
    const savingsRate    = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    function check(id: string): boolean {
      switch (id) {
        case "first_transaction": return transactions.length >= 1;
        case "tx_10":             return transactions.length >= 10;
        case "tx_50":             return transactions.length >= 50;
        case "tx_100":            return transactions.length >= 100;
        case "first_goal":        return goals.length >= 1;
        case "goal_complete":     return completedGoals >= 1;
        case "goals_3":           return goals.length >= 3;
        case "savings_1k":        return balance >= 1000;
        case "savings_10k":       return balance >= 10000;
        case "budget_ok":         return budgetPercent < 100 && budgetPercent > 0;
        case "income_added":      return incomeCount >= 1;
        case "categories_5":      return uniqueCats >= 5;
        case "positive_balance":  return balance > 0;
        case "savings_rate_20":   return savingsRate >= 20;
        default:                  return false;
      }
    }

    return allBadgeDefs.map((def) => {
      const isEarned = check(def.id);
      if (isEarned && !earnedIds.includes(def.id)) {
        const newIds   = [...earnedIds, def.id];
        const newDates = { ...earnedDates, [def.id]: new Date().toISOString() };
        setEarnedIds(newIds);
        setEarnedDates(newDates);
        if (user) {
          AsyncStorage.setItem(storageKey(user.id), JSON.stringify({ ids: newIds, dates: newDates }));
        }
      }
      return {
        ...def,
        earned: isEarned,
        earnedAt: isEarned ? (earnedDates[def.id] ?? new Date().toISOString()) : undefined,
      };
    });
  }, [transactions, goals, balance, budgetPercent, totalIncome, totalExpenses, earnedIds, earnedDates]);

  const xp = useMemo(() => badges.filter((b) => b.earned).reduce((s, b) => s + b.xp, 0), [badges]);
  const { level, levelTitle, xpToNextLevel, xpProgress } = useMemo(() => computeLevel(xp), [xp]);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <AchievementsContext.Provider value={{
      badges, xp, level, levelTitle, xpToNextLevel, xpProgress,
      earnedCount, totalCount: badges.length,
    }}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const ctx = useContext(AchievementsContext);
  if (!ctx) throw new Error("useAchievements must be used within AchievementsProvider");
  return ctx;
}
