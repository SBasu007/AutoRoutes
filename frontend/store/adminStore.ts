"use client";

import { create } from "zustand";

interface AdminUser {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AdminStore {
    token: string | null;
    user: AdminUser | null;
    isAuthenticated: boolean;
    login: (token: string, user: AdminUser) => void;
    logout: () => void;
}

export const useAdminStore = create<AdminStore>((set) => {
    let initialToken: string | null = null;
    let initialUser: AdminUser | null = null;

    if (typeof window !== "undefined") {
        initialToken = localStorage.getItem("admin_token");
        const stored = localStorage.getItem("admin_user");
        if (stored) {
            try { initialUser = JSON.parse(stored); } catch { /* ignore */ }
        }
    }

    return {
        token: initialToken,
        user: initialUser,
        isAuthenticated: !!initialToken,

        login: (token, user) => {
            if (typeof window !== "undefined") {
                localStorage.setItem("admin_token", token);
                localStorage.setItem("admin_user", JSON.stringify(user));
            }
            set({ token, user, isAuthenticated: true });
        },

        logout: () => {
            if (typeof window !== "undefined") {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
            }
            set({ token: null, user: null, isAuthenticated: false });
        },
    };
});
