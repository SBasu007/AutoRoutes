"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../../../store/adminStore";
import {
    ShieldCheck,
    Mail,
    Lock,
    AlertCircle,
    User,
    Key,
} from "lucide-react";
import Link from "next/link";

export default function AdminSignupPage() {
    const router = useRouter();
    const { login } = useAdminStore();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [adminSecret, setAdminSecret] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/admin/signup`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        adminSecret,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Signup failed");
            }

            login(data.token, data.user);
            router.push("/admin");
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-start md:items-center justify-center bg-gray-950 p-4 py-12 overflow-y-auto font-sans relative">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Brand */}
                <div className="text-center mb-8">

                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Admin Registration
                    </h1>

                    <p className="text-gray-500 text-sm mt-1">
                        Create an administrator account
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm flex items-start gap-3">
                            <AlertCircle
                                className="shrink-0 mt-0.5"
                                size={18}
                            />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Username
                            </label>

                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600">
                                    <User size={18} />
                                </span>

                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="admin_john"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Email
                            </label>

                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600">
                                    <Mail size={18} />
                                </span>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@mapmyauto.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Password
                            </label>

                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Admin Secret Key
                            </label>

                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-600">
                                    <Key size={18} />
                                </span>

                                <input
                                    type="password"
                                    required
                                    value={adminSecret}
                                    onChange={(e) =>
                                        setAdminSecret(e.target.value)
                                    }
                                    placeholder="Enter your organization's secret key"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Registering...
                                </span>
                            ) : (
                                "Register as Admin"
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Already an admin?{" "}
                    <Link
                        href="/admin/login"
                        className="text-indigo-500 hover:text-indigo-400 font-bold underline transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}