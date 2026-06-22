"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "../../components/sidebar/Sidebar";
import { UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/contributor";

    const { login } = useAuthStore();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Signup failed");
            }

            login(data.token, data.user);
            router.push(redirectUrl);
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden text-black font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                {/* Top Navbar */}
                <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between z-10 shrink-0">
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Authentication</h1>
                        <p className="text-sm text-gray-500 hidden md:block">Create an account to access contributor tools</p>
                    </div>
                </div>

                {/* Form Wrapper */}
                <div className="flex-1 flex items-center justify-center p-6 bg-gray-100 overflow-y-auto pb-24 md:pb-6">
                    <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-3xl shadow-xl relative z-10">
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 mb-4 animate-pulse">
                                <UserPlus size={28} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
                            <p className="text-gray-500 mt-2 text-sm font-medium">Join the community mapping Kolkata's auto network</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3">
                                <AlertCircle className="shrink-0 mt-0.5 animate-bounce" size={18} />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                        <User size={18} />
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. auto_mapper"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                        <Mail size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="e.g. mapping@gmail.com"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 text-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all duration-300 shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Creating Account...
                                    </span>
                                ) : (
                                    "Sign Up"
                                )}
                            </button>
                        </form>

                        <p className="text-center text-gray-500 mt-6 text-sm font-medium">
                            Already have an account?{" "}
                            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-all">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
