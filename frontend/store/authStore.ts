"use client";

import { create } from "zustand";

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AuthStore {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => {
    // Read from localStorage if running in browser
    let initialToken = null;
    let initialUser = null;

    if (typeof window !== "undefined") {
        initialToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                initialUser = JSON.parse(storedUser);
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
    }

    return {
        token: initialToken,
        user: initialUser,
        isAuthenticated: !!initialToken,

        login: (token, user) => {
            if (typeof window !== "undefined") {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
            }
            set({ token, user, isAuthenticated: true });
        },

        logout: () => {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
            set({ token: null, user: null, isAuthenticated: false });
        },
    };
});
