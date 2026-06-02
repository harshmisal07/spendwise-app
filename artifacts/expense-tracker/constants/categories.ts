export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "both" | "income" | "expense";
};

export const CATEGORIES: Category[] = [
  { id: "food", name: "Food", icon: "restaurant", color: "#FF6B6B", type: "expense" },
  { id: "shopping", name: "Shopping", icon: "cart", color: "#A29BFE", type: "expense" },
  { id: "travel", name: "Travel", icon: "airplane", color: "#74B9FF", type: "expense" },
  { id: "bills", name: "Bills", icon: "receipt", color: "#FDCB6E", type: "expense" },
  { id: "entertainment", name: "Entertainment", icon: "musical-notes", color: "#FD79A8", type: "expense" },
  { id: "salary", name: "Salary", icon: "briefcase", color: "#00B894", type: "income" },
  { id: "health", name: "Health", icon: "heart", color: "#55EFC4", type: "expense" },
  { id: "education", name: "Education", icon: "school", color: "#0984E3", type: "expense" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal-circle", color: "#B2BEC3", type: "both" },
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
