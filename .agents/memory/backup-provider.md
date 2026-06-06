---
name: BackupContext provider tree order
description: Provider nesting order and what hooks BackupProvider can safely call.
---
Provider tree: AuthProvider > CurrencyProvider > TransactionProvider > GoalsProvider > CategoryBudgetProvider > AchievementsProvider > ChallengesProvider > PremiumProvider > NotificationsProvider > BackupProvider.

BackupProvider is at the leaf, so it can safely call useTransactions(), useGoals(), usePremium(), useNotifications() etc.

After restore(), the context calls reloadTransactions() and reloadGoals() to refresh in-memory state without requiring an app restart.

**Why:** Restore writes to AsyncStorage but React state doesn't auto-refresh. The reload functions (exposed in context value) re-read from AsyncStorage and update state.
