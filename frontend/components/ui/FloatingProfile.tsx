"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { LogOut, User } from "lucide-react";

export default function FloatingProfile() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isAuthenticated || !user) {
        return null;
    }

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        router.push("/");
    };

    return (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[2000]" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold uppercase shadow-lg border-2 border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer"
            >
                {user.username[0] || <User size={24} />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform origin-top-right transition-all">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="p-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left cursor-pointer font-medium"
                        >
                            <LogOut size={16} />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
