import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
};

type TransactionContextType = {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  isOverBudget: boolean;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

function getStorageKey(userId: string) {
  return `@expense_transactions_${userId}`;
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(getStorageKey(user.id));
      setTransactions(stored ? JSON.parse(stored) : []);
    } catch {
      setTransactions([]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    loadTransactions();
  }, [loadTransactions]);

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
    const updated = transactions.map((tx) => (tx.id === id ? { ...tx, ...t } : tx));
    await persist(updated);
  }

  async function deleteTransaction(id: string) {
    await persist(transactions.filter((tx) => tx.id !== id));
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savings = balance > 0 ? balance : 0;
  const isOverBudget = user ? totalExpenses > user.budgetLimit : false;

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        totalIncome,
        totalExpenses,
        balance,
        savings,
        isOverBudget,
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
