---
name: SpendWise Provider Tree
description: Correct nesting order for all React context providers in the app root layout
---

## Provider nesting order (app/_layout.tsx)

```
AuthProvider
  CurrencyProvider
    TransactionProvider
      GoalsProvider
        CategoryBudgetProvider
          AchievementsProvider     ← needs useTransactions + useGoals
            ChallengesProvider     ← needs useTransactions
              BackupProvider (via AuthenticatedProviders)
```

**Why:** AchievementsContext reads from TransactionContext (balance, budgetPercent, totalIncome, totalExpenses, transactions) and GoalsContext (goals). ChallengesContext reads from TransactionContext. Both must be nested inside those providers or `useContext` will throw.

**How to apply:** Any new context that reads from transactions or goals must be placed inside TransactionProvider and GoalsProvider, outside BackupProvider.
