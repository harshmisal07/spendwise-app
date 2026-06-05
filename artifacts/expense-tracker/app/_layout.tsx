import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { GoalsProvider } from "@/context/GoalsContext";
import { CategoryBudgetProvider } from "@/context/CategoryBudgetContext";
import { BackupProvider } from "@/context/BackupContext";
import { AchievementsProvider } from "@/context/AchievementsContext";
import { ChallengesProvider } from "@/context/ChallengesContext";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function AuthenticatedProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <BackupProvider userId={user?.id ?? null}>{children}</BackupProvider>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-transaction" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="edit-transaction" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <CurrencyProvider>
                <TransactionProvider>
                  <GoalsProvider>
                    <CategoryBudgetProvider>
                      <AchievementsProvider>
                        <ChallengesProvider>
                          <AuthenticatedProviders>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                              <RootLayoutNav />
                            </GestureHandlerRootView>
                          </AuthenticatedProviders>
                        </ChallengesProvider>
                      </AchievementsProvider>
                    </CategoryBudgetProvider>
                  </GoalsProvider>
                </TransactionProvider>
              </CurrencyProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
