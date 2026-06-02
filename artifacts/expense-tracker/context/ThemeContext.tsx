import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  resolvedColorScheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedColorScheme: "light",
});

const THEME_KEY = "@expense_tracker_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    });
  }, []);

  async function setTheme(mode: ThemeMode) {
    setThemeState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  }

  const resolvedColorScheme: "light" | "dark" =
    theme === "system" ? (systemScheme === "dark" ? "dark" : "light") : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
