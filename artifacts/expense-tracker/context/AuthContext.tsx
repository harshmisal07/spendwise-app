import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: string;
  username: string;
  email: string;
  avatarColor: string;
  budgetLimit: number;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@expense_tracker_user";
const USERS_KEY = "@expense_tracker_users";

const AVATAR_COLORS = [
  "#6C5CE7", "#00B894", "#74B9FF", "#FD79A8", "#FDCB6E", "#A29BFE",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }

  async function getUsers(): Promise<User[]> {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async function saveUsers(users: User[]) {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function login(email: string, password: string) {
    const users = await getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error("Invalid email or password");
    setUser(found);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }

  async function register(username: string, email: string, password: string) {
    const users = await getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists");
    }
    const newUser: User = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username,
      email,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      budgetLimit: 2000,
      password,
    };
    await saveUsers([...users, newUser]);
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = updated;
      await saveUsers(users);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
