import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useTransactions } from "./TransactionContext";

export type CategoryBudget = {
  categoryId: string;
  monthlyLimit: number;
};

type CategoryBudgetContextType = {
  budgets: CategoryBudget[];
  setBudget: (categoryId: string, monthlyLimit: number) => Promise<void>;
  removeBudget: (categoryId: string) => Promise<void>;
  getBudget: (categoryId: string) => CategoryBudget | undefined;
  getCategorySpent: (categoryId: string) => number;
  getCategoryPercent: (categoryId: string) => number;
  getCategoryRemaining: (categoryId: string) => number;
  overBudgetCategories: string[];
  nearLimitCategories: string[];
};

const CategoryBudgetContext = createContext<CategoryBudgetContextType | undefined>(undefined);

function storageKey(userId: string) {
  return `@spendwise_cat_budgets_${userId}`;
}

function isSameMonth(dateStr: string, ref: Date) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function CategoryBudgetProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const [budgets, setBudgetsState] = useState<CategoryBudget[]>([]);

  const load = useCallback(async () => {
    if (!user) { setBudgetsState([]); return; }
    try {
      const raw = await AsyncStorage.getItem(storageKey(user.id));
      setBudgetsState(raw ? JSON.parse(raw) : []);
    } catch { setBudgetsState([]); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function persist(updated: CategoryBudget[]) {
    if (!user) return;
    await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(updated));
    setBudgetsState(updated);
  }

  async function setBudget(categoryId: string, monthlyLimit: number) {
    const existing = budgets.findIndex((b) => b.categoryId === categoryId);
    if (existing >= 0) {
      const updated = [...budgets];
      updated[existing] = { categoryId, monthlyLimit };
      await persist(updated);
    } else {
      await persist([...budgets, { categoryId, monthlyLimit }]);
    }
  }

  async function removeBudget(categoryId: string) {
    await persist(budgets.filter((b) => b.categoryId !== categoryId));
  }

  function getBudget(categoryId: string) {
    return budgets.find((b) => b.categoryId === categoryId);
  }

  const now = new Date();

  const monthlySpentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense" && isSameMonth(t.date, now))
      .forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return map;
  }, [transactions]);

  function getCategorySpent(categoryId: string) {
    return monthlySpentByCategory[categoryId] ?? 0;
  }

  function getCategoryPercent(categoryId: string) {
    const b = getBudget(categoryId);
    if (!b || b.monthlyLimit <= 0) return 0;
    return Math.min((getCategorySpent(categoryId) / b.monthlyLimit) * 100, 100);
  }

  function getCategoryRemaining(categoryId: string) {
    const b = getBudget(categoryId);
    if (!b) return 0;
    return Math.max(b.monthlyLimit - getCategorySpent(categoryId), 0);
  }

  const overBudgetCategories = useMemo(
    () => budgets.filter((b) => getCategorySpent(b.categoryId) > b.monthlyLimit).map((b) => b.categoryId),
    [budgets, monthlySpentByCategory]
  );

  const nearLimitCategories = useMemo(
    () =>
      budgets
        .filter((b) => {
          const pct = getCategoryPercent(b.categoryId);
          return pct >= 80 && pct < 100;
        })
        .map((b) => b.categoryId),
    [budgets, monthlySpentByCategory]
  );

  return (
    <CategoryBudgetContext.Provider value={{
      budgets, setBudget, removeBudget, getBudget,
      getCategorySpent, getCategoryPercent, getCategoryRemaining,
      overBudgetCategories, nearLimitCategories,
    }}>
      {children}
    </CategoryBudgetContext.Provider>
  );
}

export function useCategoryBudgets() {
  const ctx = useContext(CategoryBudgetContext);
  if (!ctx) throw new Error("useCategoryBudgets must be used within CategoryBudgetProvider");
  return ctx;
}
