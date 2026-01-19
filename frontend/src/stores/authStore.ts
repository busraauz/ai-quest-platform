"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { config } from "@/lib/config";
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<Record<string, unknown>>;
  signup: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<Record<string, unknown>>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      initialize: async () => {
        if (get().initialized) {
          return;
        }
        set({ initialized: true });
        await get().refreshUser();
      },
      refreshUser: async () => {
        set({ loading: true });
        try {
          const res = await fetch(`${config.apiBaseUrl}/api/auth/me`, {
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            set({ user: data });
          } else {
            set({ user: null });
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          set({ user: null });
        } finally {
          set({ loading: false });
        }
      },
      login: async (email: string, password: string) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (data as { detail?: string }).detail || "Login failed",
          );
        }

        if ((data as { user?: User }).user) {
          set({ user: (data as { user: User }).user });
        } else {
          await get().refreshUser();
        }

        return data as Record<string, unknown>;
      },
      signup: async (email: string, password: string, displayName?: string) => {
        const res = await fetch(`${config.apiBaseUrl}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
            display_name: displayName,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (data as { detail?: string }).detail || "Signup failed",
          );
        }

        if ((data as { user?: User }).user) {
          set({ user: (data as { user: User }).user });
        }

        return data as Record<string, unknown>;
      },
      logout: async () => {
        try {
          await fetch(`${config.apiBaseUrl}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({ user: null });
        }
      },
    }),
    {
      name: "quest-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
