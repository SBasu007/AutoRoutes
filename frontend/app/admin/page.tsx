"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../../store/adminStore";
import {
    ShieldCheck, LogOut, CheckCircle, XCircle, Clock,
    MapPin, Route, RefreshCw, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";

interface Contribution {
    id: number;
    status: string;
    addedBy: string | null;
    createdAt: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
    standPayload: Record<string, any> | null;
    routePayload: Record<string, any> | null;
    routeStopsPayload: Array<{ stand_id: number; stop_order: number }> | null;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { token, user, logout, isAuthenticated } = useAdminStore();

    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Auth guard
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/admin/login");
        }
    }, [isAuthenticated, router]);

    const fetchContributions = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/contributions/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    logout();
                    router.push("/admin/login");
                    return;
                }
                throw new Error("Failed to fetch contributions");
            }
            const data = await res.json();
            setContributions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, logout, router]);

    useEffect(() => {
        fetchContributions();
    }, [fetchContributions]);

    const handleReview = async (id: number, status: "approved" | "rejected") => {
        if (!token) return;
        setActionLoading(id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/contributions/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    review_notes: reviewNotes[id] || null,
                    reviewed_by: user?.id,
                }),
            });
            if (!res.ok) throw new Error("Review action failed");
            // Remove from list on success
            setContributions((prev) => prev.filter((c) => c.id !== id));
            setExpandedId(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/admin/login");
    };

    if (!isAuthenticated) return null;

    const getContribType = (c: Contribution) => {
        if (c.standPayload) return "stand";
        if (c.routePayload) return "route";
        return "unknown";
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans">
            {/* Top Bar */}
            <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold text-white leading-none">Admin Portal</h1>
                        <p className="text-xs text-gray-500 mt-0.5">MapMyAuto</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-sm">
                            <div className="w-6 h-6 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                                {user.username.slice(0, 2)}
                            </div>
                            <span className="text-gray-300 font-semibold">{user.username}</span>
                            <span className="text-indigo-400 text-xs bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">admin</span>
                        </div>
                    )}

                    <button
                        onClick={() => fetchContributions()}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white">Pending Contributions</h2>
                        <p className="text-gray-500 text-sm mt-1">Review and approve or reject submissions from contributors</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2">
                        <Clock size={16} />
                        {loading ? "..." : contributions.length} pending
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-2xl text-sm flex items-start gap-3">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : contributions.length === 0 ? (
                    <div className="text-center py-20 text-gray-600">
                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500/30" />
                        <p className="text-lg font-semibold">All caught up!</p>
                        <p className="text-sm mt-1">No pending contributions to review.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contributions.map((c) => {
                            const type = getContribType(c);
                            const isExpanded = expandedId === c.id;
                            const isActioning = actionLoading === c.id;

                            return (
                                <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
                                    {/* Header row */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                        className="w-full flex items-center justify-between p-4 sm:p-5 gap-4 text-left hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${type === "stand"
                                                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                                : "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                                                }`}>
                                                {type === "stand" ? <MapPin size={18} /> : <Route size={18} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-sm capitalize">
                                                    {type === "stand"
                                                        ? c.standPayload?.name ?? "Unnamed Stand"
                                                        : c.routePayload?.name ?? `Route #${c.id}`}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Contribution #{c.id} · {type} · {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-gray-600">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="px-4 sm:px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                                            {/* Payload preview */}
                                            <div className="bg-gray-900/60 rounded-xl p-4 overflow-x-auto">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payload</p>
                                                {type === "stand" && c.standPayload && (
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        {[
                                                            ["Name", c.standPayload.name],
                                                            ["Type", c.standPayload.type],
                                                            ["Latitude", c.standPayload.lat],
                                                            ["Longitude", c.standPayload.lng],
                                                            ["Address", c.standPayload.address ?? "—"],
                                                        ].map(([label, val]) => (
                                                            <div key={label as string}>
                                                                <span className="text-gray-500 text-xs">{label}</span>
                                                                <p className="text-white font-semibold">{String(val)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {type === "route" && c.routePayload && (
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        {[
                                                            ["Name", c.routePayload.name ?? "—"],
                                                            ["From Stand ID", c.routePayload.from_stand_id],
                                                            ["To Stand ID", c.routePayload.to_stand_id],
                                                            ["Est. Time (min)", c.routePayload.estimated_time_min ?? "—"],
                                                            ["Stops", c.routeStopsPayload?.length ?? 0],
                                                            ["Path Points", (() => { try { return JSON.parse(c.routePayload.path).length; } catch { return "—"; } })()],
                                                        ].map(([label, val]) => (
                                                            <div key={label as string}>
                                                                <span className="text-gray-500 text-xs">{label}</span>
                                                                <p className="text-white font-semibold">{String(val)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Review notes */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Review Notes (Optional)</label>
                                                <textarea
                                                    rows={2}
                                                    value={reviewNotes[c.id] ?? ""}
                                                    onChange={(e) => setReviewNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                    placeholder="Add a note for the contributor..."
                                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleReview(c.id, "approved")}
                                                    disabled={isActioning}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 hover:text-green-300 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {isActioning ? <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReview(c.id, "rejected")}
                                                    disabled={isActioning}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {isActioning ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <XCircle size={16} />}
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
