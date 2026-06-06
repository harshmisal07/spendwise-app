import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type TransactionType = "income" | "expense";
export type RecurringInterval = "none" | "daily" | "weekly" | "monthly";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
  recurring?: RecurringInterval;
};

type TransactionContextType = {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  isOverBudget: boolean;
  todayExpenses: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
  budgetRemaining: number;
  budgetPercent: number;
  rawBudgetPercent: number;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

function getStorageKey(userId: string) {
  return `@expense_transactions_${userId}`;
}

function isSameDay(dateStr: string, ref: Date) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

function isSameMonth(dateStr: string, ref: Date) {
  const d = new Date(dateStr + "T12:00:00");
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) { setTransactions([]); setIsLoading(false); return; }
    try {
      const stored = await AsyncStorage.getItem(getStorageKey(user.id));
      setTransactions(stored ? JSON.parse(stored) : []);
    } catch { setTransactions([]); }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { setIsLoading(true); loadTransactions(); }, [loadTransactions]);

  async function persist(updated: Transaction[]) {
    if (!user) return;
    await AsyncStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
    setTransactions(updated);
  }

  async function addTransaction(t: Omit<Transaction, "id" | "createdAt">) {
    const newT: Transaction = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    await persist([newT, ...transactions]);
  }

  async function updateTransaction(id: string, t: Partial<Transaction>) {
    await persist(transactions.map((tx) => (tx.id === id ? { ...tx, ...t } : tx)));
  }

  async function deleteTransaction(id: string) {
    await persist(transactions.filter((tx) => tx.id !== id));
  }

  const now = new Date();

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savings = balance > 0 ? balance : 0;

  const todayExpenses = transactions
    .filter((t) => t.type === "expense" && isSameDay(t.date, now))
    .reduce((s, t) => s + t.amount, 0);

  const thisMonthIncome = transactions
    .filter((t) => t.type === "income" && isSameMonth(t.date, now))
    .reduce((s, t) => s + t.amount, 0);

  const thisMonthExpenses = transactions
    .filter((t) => t.type === "expense" && isSameMonth(t.date, now))
    .reduce((s, t) => s + t.amount, 0);

  const budgetLimit = user?.budgetLimit ?? 0;
  const isOverBudget = budgetLimit > 0 ? thisMonthExpenses > budgetLimit : false;
  const budgetRemaining = Math.max(budgetLimit - thisMonthExpenses, 0);
  const rawBudgetPercent = budgetLimit > 0 ? (thisMonthExpenses / budgetLimit) * 100 : 0;
  const budgetPercent = Math.min(rawBudgetPercent, 100);

  return (
    <TransactionContext.Provider
      value={{
        transactions, isLoading, addTransaction, updateTransaction, deleteTransaction,
        reload: loadTransactions,
        totalIncome, totalExpenses, balance, savings, isOverBudget,
        todayExpenses, thisMonthIncome, thisMonthExpenses, budgetRemaining,
        budgetPercent, rawBudgetPercent,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}
