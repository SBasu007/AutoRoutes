"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Clock, MapPin, Route, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
    const { token, user } = useAuthStore();
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved": return <CheckCircle className="text-green-500" size={18} />;
            case "rejected": return <XCircle className="text-red-500" size={18} />;
            default: return <Clock className="text-yellow-500" size={18} />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-50 text-green-700 border-green-200";
            case "rejected": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-yellow-50 text-yellow-700 border-yellow-200";
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 text-black font-sans">
            <Sidebar />

            <div className="flex-1 overflow-y-auto h-screen w-full relative pb-24 md:pb-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 py-5 px-6 sm:px-10 shadow-sm">
                    <div className="max-w-4xl flex items-center gap-6">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold uppercase shadow-inner border-4 border-white">
                            {user?.username?.[0] || "?"}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">{user?.username}</h1>
                            <p className="text-gray-500 mt-1">{user?.email}</p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 w-full max-w-4xl px-6 sm:px-10 py-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Your Contributions</h2>

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-200">
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <Route className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 font-medium">You haven't made any contributions yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((c) => {
                                const isStand = !!c.standPayload;
                                const title = isStand ? c.standPayload.name : (c.routePayload?.name || "Unnamed Route");

                                return (
                                    <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isStand ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"}`}>
                                                    {isStand ? <MapPin size={24} /> : <Route size={24} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900 text-lg capitalize">{title}</h3>
                                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                                                            {isStand ? "Stand" : "Route"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Submitted on {new Date(c.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:items-end gap-2">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold capitalize w-max ${getStatusStyle(c.status)}`}>
                                                    {getStatusIcon(c.status)}
                                                    {c.status}
                                                </div>
                                            </div>
                                        </div>

                                        {c.reviewNotes && (
                                            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Admin Review Notes</p>
                                                <p className="text-gray-700 text-sm">{c.reviewNotes}</p>
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