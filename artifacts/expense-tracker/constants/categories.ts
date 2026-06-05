export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "both" | "income" | "expense";
};

export const CATEGORIES: Category[] = [
  { id: "food",          name: "Food",          icon: "restaurant",        color: "#FF6B6B", type: "expense" },
  { id: "shopping",      name: "Shopping",      icon: "bag-handle",        color: "#A29BFE", type: "expense" },
  { id: "travel",        name: "Travel",        icon: "airplane",          color: "#74B9FF", type: "expense" },
  { id: "bills",         name: "Bills",         icon: "receipt",           color: "#FDCB6E", type: "expense" },
  { id: "entertainment", name: "Entertainment", icon: "film",              color: "#FD79A8", type: "expense" },
  { id: "health",        name: "Health",        icon: "medkit",            color: "#55EFC4", type: "expense" },
  { id: "education",     name: "Education",     icon: "book",              color: "#0984E3", type: "expense" },
  { id: "investment",    name: "Investment",    icon: "trending-up",       color: "#00CEC9", type: "expense" },
  { id: "emi",           name: "EMI",           icon: "card",              color: "#E17055", type: "expense" },
  { id: "insurance",     name: "Insurance",     icon: "shield-checkmark",  color: "#6C5CE7", type: "expense" },
  { id: "rent",          name: "Rent",          icon: "home",              color: "#B8860B", type: "expense" },
  { id: "salary",        name: "Salary",        icon: "cash",              color: "#00B894", type: "income"  },
  { id: "freelance",     name: "Freelance",     icon: "laptop",            color: "#00CEC9", type: "income"  },
  { id: "business",      name: "Business",      icon: "briefcase",         color: "#6C5CE7", type: "income"  },
  { id: "bonus",         name: "Bonus",         icon: "gift",              color: "#FDCB6E", type: "income"  },
  { id: "other",         name: "Other",         icon: "apps",              color: "#B2BEC3", type: "both"    },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (c) => c.type === "expense" || c.type === "both"
);

export const INCOME_CATEGORIES = CATEGORIES.filter(
  (c) => c.type === "income" || c.type === "both"
);

export function getCategoryById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
