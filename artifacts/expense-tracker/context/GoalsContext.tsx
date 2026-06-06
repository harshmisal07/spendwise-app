import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type Goal = {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  createdAt: string;
};

type GoalsContextType = {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "savedAmount">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  addToSaved: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  totalSaved: number;
  totalTarget: number;
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

function storageKey(userId: string) {
  return `@spendwise_goals_${userId}`;
}

export const GOAL_COLORS = ["#6C5CE7", "#00B894", "#FDCB6E", "#FF6B6B", "#74B9FF", "#FD79A8", "#00CEC9", "#A29BFE"];
export const GOAL_ICONS = ["trophy", "home", "car", "airplane", "phone-portrait", "school", "heart", "gift", "briefcase", "bicycle"];

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setGoals([]); setIsLoading(false); return; }
    try {
      const raw = await AsyncStorage.getItem(storageKey(user.id));
      setGoals(raw ? JSON.parse(raw) : []);
    } catch { setGoals([]); }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { setIsLoading(true); load(); }, [load]);

  async function persist(updated: Goal[]) {
    if (!user) return;
    await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(updated));
    setGoals(updated);
  }

  async function addGoal(g: Omit<Goal, "id" | "createdAt" | "savedAmount">) {
    const newGoal: Goal = {
      ...g,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      savedAmount: 0,
      createdAt: new Date().toISOString(),
    };
    await persist([newGoal, ...goals]);
  }

  async function updateGoal(id: string, updates: Partial<Goal>) {
    await persist(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }

  async function addToSaved(id: string, amount: number) {
    await persist(
      goals.map((g) =>
        g.id === id
          ? { ...g, savedAmount: Math.min(g.savedAmount + amount, g.targetAmount) }
          : g
      )
    );
  }

  async function deleteGoal(id: string) {
    await persist(goals.filter((g) => g.id !== id));
  }

  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <GoalsContext.Provider value={{ goals, isLoading, addGoal, updateGoal, addToSaved, deleteGoal, reload: load, totalSaved, totalTarget }}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
