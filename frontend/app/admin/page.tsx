'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
interface Stand {
    id: number;
    name: string;
    lat: number;
    lng: number;
    type: string;
}

interface Route {
    id: number;
    name?: string;
    estimatedTimeMin?: number;
    from?: Stand;
    to?: Stand;
    stops?: Stand[];
}
export default function AdminPortal() {
    const [pendingStands, setPendingStands] = useState<Stand[]>([]);
    const [pendingRoutes, setPendingRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchPendingData();
    }, []);

    const fetchPendingData = async () => {
        setLoading(true);
        try {
            const [standsRes, routesRes] = await Promise.all([
                fetch(`${apiUrl}/admin/stands/pending`),
                fetch(`${apiUrl}/admin/routes/pending`)
            ]);

            const standsData = await standsRes.json();
            const routesData = await routesRes.json();

            setPendingStands(standsData);
            setPendingRoutes(routesData);
        } catch (error) {
            console.error('Failed to fetch pending data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStandStatus = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch(`${apiUrl}/admin/stands/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setPendingStands(pendingStands.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Error updating stand status:', error);
        }
    };

    const handleRouteStatus = async (id: number, status: 'approved' | 'rejected') => {
        try {
            const res = await fetch(`${apiUrl}/admin/routes/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setPendingRoutes(pendingRoutes.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Error updating route status:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Admin Portal
                        </h1>
                        <p className="text-zinc-400 mt-2">Review and approve pending community contributions.</p>
                    </div>
                    <Link href="/">
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors border border-zinc-700">
                            Back to Map
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Stands Column */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-zinc-100">Pending Stands</h2>
                            <span className="bg-zinc-800 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-zinc-700">
                                {pendingStands.length} pending
                            </span>
                        </div>

                        {pendingStands.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                No pending stands.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingStands.map(stand => (
                                    <div key={stand.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-lg">{stand.name}</h3>
                                                <p className="text-zinc-400 text-sm">{stand.type.replace('_', ' ')}</p>
                                                <p className="text-zinc-500 text-xs mt-1 font-mono">ID: {stand.id} • Lat: {stand.lat.toFixed(4)}, Lng: {stand.lng.toFixed(4)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                onClick={() => handleStandStatus(stand.id, 'approved')}
                                                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleStandStatus(stand.id, 'rejected')}
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Routes Column */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-zinc-100">Pending Routes</h2>
                            <span className="bg-zinc-800 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium border border-zinc-700">
                                {pendingRoutes.length} pending
                            </span>
                        </div>

                        {pendingRoutes.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                No pending routes.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRoutes.map(route => (
                                    <div key={route.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-medium text-lg">{route.name || `${route.from?.name} to ${route.to?.name}`}</h3>
                                                <p className="text-zinc-400 text-sm mt-1">Est. Time: {route.estimatedTimeMin} min • Stops: {route.stops?.length || 0}</p>
                                                <p className="text-zinc-500 text-xs mt-1 font-mono">ID: {route.id}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 mb-4 pl-3 border-l-2 border-zinc-800">
                                            <div className="text-sm text-zinc-300"><span className="text-emerald-400 mr-2">●</span> {route.from?.name}</div>
                                            {route.stops?.map((stop: any, idx: number) => (
                                                <div key={idx} className="text-sm text-zinc-500 my-1"><span className="text-zinc-600 mr-2">|</span> {stop.name}</div>
                                            ))}
                                            <div className="text-sm text-zinc-300"><span className="text-red-400 mr-2">■</span> {route.to?.name}</div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleRouteStatus(route.id, 'approved')}
                                                className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleRouteStatus(route.id, 'rejected')}
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
