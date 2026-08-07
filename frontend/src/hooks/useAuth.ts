"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "seller" | "buyer";
  avatar: string | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

const TOKEN_KEY = "luxe_token";
const USER_KEY = "luxe_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    const token = getStoredToken();
    if (stored && token) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(err.detail || "Login failed");
      }

      const data: LoginResponse = await res.json();
      storeAuth(data.access_token, data.user);
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  const redirectByRole = useCallback(
    (userObj: AuthUser) => {
      if (userObj.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    },
    [router]
  );

  return {
    user,
    loading,
    login,
    logout,
    redirectByRole,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isSeller: user?.role === "seller",
    isBuyer: user?.role === "buyer",
  };
}
