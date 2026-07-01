"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { Clock, MapPin, Route, CheckCircle, XCircle, AlertCircle, LogOut, Mail, Calendar, TrendingUp, Award } from "lucide-react";
import Sidebar from "../../components/sidebar/Sidebar";

interface Contribution {
    id: number;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
    standPayload: any | null;
    routePayload: any | null;
}

export default function ProfileContent() {
    const { token, user, logout } = useAuthStore();
    const router = useRouter();
    const [history, setHistory] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/contributor/me/history`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error("Failed to fetch contribution history");
                const data = await res.json();
                setHistory(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [token]);

    const stats = {
        total: history.length,
        approved: history.filter((c) => c.status === "approved").length,
        pending: history.filter((c) => c.status === "pending").length,
        rejected: history.filter((c) => c.status === "rejected").length,
        stands: history.filter((c) => !!c.standPayload).length,
        routes: history.filter((c) => !c.standPayload).length,
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved": return <CheckCircle className="text-green-500" size={15} />;
            case "rejected": return <XCircle className="text-red-500" size={15} />;
            default: return <Clock className="text-amber-500" size={15} />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-50 text-green-700 border-green-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-amber-50 text-amber-700 border-amber-200";
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 text-black font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 overflow-y-auto h-screen w-full relative pb-28 md:pb-0">
                {/* Hero Header */}
                <header className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 px-5 sm:px-10 pt-8 pb-20 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl" />

                    <div className="relative max-w-4xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-md text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-extrabold uppercase shadow-lg border border-white/20">
                                {user?.username?.[0] || "?"}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user?.username}</h1>
                                <p className="text-blue-100 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" />
                                    {user?.email}
                                </p>
                                {user?.role && (
                                    <span className="inline-flex mt-2 items-center gap-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold rounded-full uppercase tracking-wide border border-white/20">
                                        <Award className="w-3 h-3" /> {user.role}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white border border-white/25 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Stats Cards — overlapping hero */}
                <main className="relative max-w-4xl px-5 sm:px-10 -mt-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={TrendingUp} label="Total" value={stats.total} tone="indigo" />
                        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} tone="green" />
                        <StatCard icon={Clock} label="Pending" value={stats.pending} tone="amber" />
                        <StatCard icon={MapPin} label="Stands" value={stats.stands} tone="blue" />
                    </div>

                    {/* Section title */}
                    <div className="mt-8 mb-4 flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Your Contributions</h2>
                        {stats.total > 0 && (
                            <span className="text-xs font-semibold text-gray-500">{stats.routes} routes · {stats.stands} stands</span>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-2xl text-sm flex items-start gap-3 border border-red-200">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm">
                            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                <Route className="text-gray-300" size={32} />
                            </div>
                            <p className="text-gray-800 font-bold">No contributions yet</p>
                            <p className="text-gray-500 text-sm mt-1">Add stands &amp; routes to see them here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pb-10">
                            {history.map((c) => {
                                const isStand = !!c.standPayload;
                                const title = isStand ? c.standPayload.name : (c.routePayload?.name || "Unnamed Route");

                                return (
                                    <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${isStand ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                                                    {isStand ? <MapPin size={20} /> : <Route size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="font-bold text-gray-900 text-[15px] capitalize truncate">{title}</h3>
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                            {isStand ? "Stand" : "Route"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(c.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold capitalize w-max ${getStatusStyle(c.status)}`}>
                                                {getStatusIcon(c.status)}
                                                {c.status}
                                            </div>
                                        </div>

                                        {c.reviewNotes && (
                                            <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Review Notes</p>
                                                <p className="text-gray-700 text-xs">{c.reviewNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "indigo" | "green" | "amber" | "blue" }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-600",
        green: "bg-green-50 text-green-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-extrabold text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">{label}</p>
            </div>
        </div>
    );
}
