import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationSettings = {
  budgetAlerts: boolean;
  goalReminders: boolean;
  savingsReminders: boolean;
  weeklyReport: boolean;
  dailyReminder: boolean;
};

type NotificationsContextType = {
  settings: NotificationSettings;
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  updateSetting: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
  sendBudgetAlert: (percentUsed: number, budgetLimit: number, symbol: string) => Promise<void>;
  sendGoalReminder: (goalName: string, daysLeft: number) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);
const SETTINGS_KEY = "@spendwise_notif_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  budgetAlerts: true,
  goalReminders: true,
  savingsReminders: true,
  weeklyReport: false,
  dailyReminder: false,
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  async function loadSettings() {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }

  async function checkPermissions() {
    if (Platform.OS === "web") { setPermissionGranted(true); return; }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === "granted");
    } catch { setPermissionGranted(false); }
  }

  async function requestPermission(): Promise<boolean> {
    if (Platform.OS === "web") { setPermissionGranted(true); return true; }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";
      setPermissionGranted(granted);
      return granted;
    } catch { return false; }
  }

  async function updateSetting(key: keyof NotificationSettings, value: boolean) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    if (value && !permissionGranted) await requestPermission();
  }

  async function sendBudgetAlert(percentUsed: number, budgetLimit: number, symbol: string) {
    if (!settings.budgetAlerts || Platform.OS === "web") return;
    if (!permissionGranted) return;
    const over = percentUsed >= 100;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: over ? "⚠️ Budget Exceeded!" : `💰 Budget Alert: ${Math.round(percentUsed)}% Used`,
          body: over
            ? `You've exceeded your ${symbol}${budgetLimit.toLocaleString()} budget this month.`
            : `You've used ${Math.round(percentUsed)}% of your ${symbol}${budgetLimit.toLocaleString()} budget.`,
        },
        trigger: null,
      });
    } catch {}
  }

  async function sendGoalReminder(goalName: string, daysLeft: number) {
    if (!settings.goalReminders || Platform.OS === "web") return;
    if (!permissionGranted || daysLeft > 7) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎯 Goal Deadline Approaching",
          body: `"${goalName}" is due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Keep saving!`,
        },
        trigger: null,
      });
    } catch {}
  }

  return (
    <NotificationsContext.Provider value={{
      settings, permissionGranted, requestPermission,
      updateSetting, sendBudgetAlert, sendGoalReminder,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
