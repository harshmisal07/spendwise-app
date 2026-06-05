---
name: SpendWise Category Export
description: How to look up a category by ID in the SpendWise app
---

## getCategoryById

`constants/categories.ts` exports `getCategoryById(id: string): Category` which returns the matching category or falls back to "Other". Use this instead of inline `CATEGORIES.find(...)` calls.

**Why:** Consistent fallback behavior (never undefined), cleaner import surface.

**How to apply:** Import `{ getCategoryById }` from `@/constants/categories` wherever you need a single category by ID (AI Coach screen, analytics, insights, etc.).

## Category counts (as of last edit)
- 11 expense categories (food, shopping, travel, bills, entertainment, health, education, investment, emi, insurance, rent)
- 4 income categories (salary, freelance, business, bonus)
- 1 both category (other)
- Total: 16 categories
