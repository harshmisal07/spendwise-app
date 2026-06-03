import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  flag: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee",   locale: "en-IN", flag: "🇮🇳" },
  USD: { code: "USD", symbol: "$", name: "US Dollar",       locale: "en-US", flag: "🇺🇸" },
  EUR: { code: "EUR", symbol: "€", name: "Euro",            locale: "de-DE", flag: "🇪🇺" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound",  locale: "en-GB", flag: "🇬🇧" },
};

const STORAGE_KEY = "@spendwise_currency";

function detectCurrency(): CurrencyCode {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
    if (tz === "Europe/London") return "GBP";
    if (tz.startsWith("Europe/")) return "EUR";
    const locale =
      Platform.OS === "web" && typeof navigator !== "undefined"
        ? navigator.language
        : Intl.NumberFormat().resolvedOptions().locale ?? "";
    if (locale.toLowerCase().endsWith("-in")) return "INR";
    if (locale.toLowerCase().startsWith("en-gb")) return "GBP";
    if (!locale.toLowerCase().startsWith("en")) return "EUR";
  } catch {}
  return "USD";
}

type CurrencyContextType = {
  currency: CurrencyCode;
  info: CurrencyInfo;
  setCurrency: (c: CurrencyCode) => Promise<void>;
  format: (n: number) => string;
  formatFull: (n: number) => string;
  symbol: string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(detectCurrency);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v && v in CURRENCIES) setCurrencyState(v as CurrencyCode);
    });
  }, []);

  const setCurrency = useCallback(async (c: CurrencyCode) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(STORAGE_KEY, c);
  }, []);

  const info = CURRENCIES[currency];

  function format(n: number): string {
    const abs = Math.abs(n);
    try {
      const formatted = abs.toLocaleString(info.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${info.symbol}${formatted}`;
    } catch {
      return `${info.symbol}${abs.toFixed(0)}`;
    }
  }

  function formatFull(n: number): string {
    const abs = Math.abs(n);
    try {
      const formatted = abs.toLocaleString(info.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${info.symbol}${formatted}`;
    } catch {
      return `${info.symbol}${abs.toFixed(2)}`;
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, info, setCurrency, format, formatFull, symbol: info.symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
