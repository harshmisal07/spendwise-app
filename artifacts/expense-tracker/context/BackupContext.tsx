import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const BACKUP_META_KEY = "@spendwise_backup_meta";
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type BackupMeta = {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
};

type BackupContextType = {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  isBackingUp: boolean;
  isRestoring: boolean;
  backup: () => Promise<{ success: boolean; message: string }>;
  restore: () => Promise<{ success: boolean; message: string }>;
};

const BackupContext = createContext<BackupContextType | undefined>(undefined);

export function BackupProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [meta, setMeta] = useState<BackupMeta>({ lastBackupAt: null, lastRestoreAt: null });
  const [isBackingUp,  setIsBackingUp]  = useState(false);
  const [isRestoring,  setIsRestoring]  = useState(false);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(`${BACKUP_META_KEY}_${userId}`).then((v) => {
      if (v) setMeta(JSON.parse(v));
    });
  }, [userId]);

  async function saveMeta(updated: BackupMeta) {
    setMeta(updated);
    if (userId) await AsyncStorage.setItem(`${BACKUP_META_KEY}_${userId}`, JSON.stringify(updated));
  }

  async function backup(): Promise<{ success: boolean; message: string }> {
    if (!userId) return { success: false, message: "Not logged in" };
    setIsBackingUp(true);
    try {
      const [txRaw, goalsRaw, budgetsRaw, currencyRaw] = await Promise.all([
        AsyncStorage.getItem(`@expense_transactions_${userId}`),
        AsyncStorage.getItem(`@spendwise_goals_${userId}`),
        AsyncStorage.getItem(`@spendwise_cat_budgets_${userId}`),
        AsyncStorage.getItem(`@spendwise_currency`),
      ]);
      const payload = {
        transactions:    txRaw    ? JSON.parse(txRaw)      : [],
        goals:           goalsRaw ? JSON.parse(goalsRaw)   : [],
        categoryBudgets: budgetsRaw ? JSON.parse(budgetsRaw) : [],
        currency:        currencyRaw ?? "INR",
      };
      const res = await fetch(`${API_BASE}/backup/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const backedUpAt = new Date().toISOString();
      await saveMeta({ ...meta, lastBackupAt: backedUpAt });
      return { success: true, message: "Backup saved to cloud" };
    } catch (err: any) {
      return { success: false, message: err?.message ?? "Backup failed" };
    } finally {
      setIsBackingUp(false);
    }
  }

  async function restore(): Promise<{ success: boolean; message: string }> {
    if (!userId) return { success: false, message: "Not logged in" };
    setIsRestoring(true);
    try {
      const res = await fetch(`${API_BASE}/backup/${userId}`);
      if (res.status === 404) return { success: false, message: "No cloud backup found" };
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      await Promise.all([
        AsyncStorage.setItem(`@expense_transactions_${userId}`, JSON.stringify(data.transactions ?? [])),
        AsyncStorage.setItem(`@spendwise_goals_${userId}`, JSON.stringify(data.goals ?? [])),
        AsyncStorage.setItem(`@spendwise_cat_budgets_${userId}`, JSON.stringify(data.categoryBudgets ?? [])),
        data.currency ? AsyncStorage.setItem(`@spendwise_currency`, data.currency) : Promise.resolve(),
      ]);
      const lastRestoreAt = new Date().toISOString();
      await saveMeta({ ...meta, lastRestoreAt });
      return { success: true, message: `Restored from ${formatTime(data.backedUpAt)}` };
    } catch (err: any) {
      return { success: false, message: err?.message ?? "Restore failed" };
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <BackupContext.Provider value={{
      lastBackupAt:  meta.lastBackupAt,
      lastRestoreAt: meta.lastRestoreAt,
      isBackingUp, isRestoring, backup, restore,
    }}>
      {children}
    </BackupContext.Provider>
  );
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export function useBackup() {
  const ctx = useContext(BackupContext);
  if (!ctx) throw new Error("useBackup must be used within BackupProvider");
  return ctx;
}
