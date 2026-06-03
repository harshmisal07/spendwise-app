import { useState, useEffect } from "react";
import { Platform } from "react-native";

export type Region = "IN" | "INTL";

export interface RegionInfo {
  region: Region;
  isIndia: boolean;
  currencySymbol: string;
  currencyCode: string;
  setRegion: (r: Region) => void;
}

function detectRegion(): Region {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === "Asia/Kolkata" || timeZone === "Asia/Calcutta") return "IN";
    const locale =
      (Platform.OS === "web" && typeof navigator !== "undefined"
        ? navigator.language
        : Intl.NumberFormat().resolvedOptions().locale) ?? "";
    if (locale.toLowerCase().endsWith("-in") || locale.toLowerCase() === "en_in") return "IN";
  } catch {
    // fallback to INTL
  }
  return "INTL";
}

export function useRegion(): RegionInfo {
  const [region, setRegion] = useState<Region>(detectRegion);

  const isIndia = region === "IN";

  return {
    region,
    isIndia,
    currencySymbol: isIndia ? "₹" : "$",
    currencyCode: isIndia ? "INR" : "USD",
    setRegion,
  };
}
