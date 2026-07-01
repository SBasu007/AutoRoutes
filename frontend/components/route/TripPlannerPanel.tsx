/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import SearchableSelect from "../ui/SearchableSelect";
import { getStands, getNearbyRoutes } from "@/services/contributorService";
import {
    MapPin,
    AlertTriangle,
    Clock,
    Loader2,
    Search,
} from "lucide-react";

export default function TripPlannerPanel() {
    const { nearbyRoutes, setNearbyRoutes, setSelectedRoute, selectedRoute, setShowMap, setTripPlan } = useRouteStore();
    const [stands, setStands] = useState<any[]>([]);
    const [destinationId, setDestinationId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getStands()
            .then((data) => setStands(data))
            .catch((err) => console.error("Failed to fetch stands", err));
    }, []);

    const handleSearchRoutes = async () => {
        if (!destinationId) {
            setError("Please select a location first.");
            return;
        }

        setError(null);
        setTripPlan(null); // Clear any existing trip plan just in case
        setIsLoading(true);

        const destStand = stands.find((s) => s.id === destinationId);
        if (!destStand) {
            setError("Invalid location.");
            setIsLoading(false);
            return;
        }

        try {
            const routes = await getNearbyRoutes(destStand.lat, destStand.lng, 2); // 2km radius
            setNearbyRoutes(routes);
            setSelectedRoute(null); // Reset selection
        } catch (err: any) {
            setError(err.message || "Failed to find routes.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderResults = () => {
        if (nearbyRoutes.length === 0) {
            if (error || isLoading || !destinationId) return null;
            // Provide feedback if a search has been completed with no results, but we can't easily track that state uniquely here without adding more state.
            // Returning null is fine for now, or just an empty list.
            return null;
        }

        return (
            <div className="space-y-4 mt-2 pb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Routes within 2km</h3>
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        {nearbyRoutes.length} Found
                    </span>
                </div>

                <div className="flex flex-col gap-3">
                    {nearbyRoutes.map((route: any) => (
                        <button
                            key={route.id}
                            onClick={() => {
                                setSelectedRoute(route);
                                setShowMap(true);
                            }}
                            className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group bg-white border ${
                                selectedRoute?.id === route.id
                                    ? "border-blue-500 shadow-[0_4px_16px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/10"
                                    : "border-gray-100 hover:border-blue-200 hover:shadow-sm"
                            }`}
                        >
                            <h3 className={`font-bold text-[15px] mb-3 truncate ${selectedRoute?.id === route.id ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                {route.name || "Auto Route"}
                            </h3>
                            
                            <div className="flex flex-col gap-2 relative">
                                <div className="absolute left-[7px] top-[10px] bottom-[10px] w-0.5 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors" />
                                
                                <div className="flex items-center gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 z-10 ring-4 ring-white shadow-sm" />
                                    <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                                        {route.from?.name || "Start Point"}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2.5">
                                    <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 z-10 ring-4 ring-white shadow-sm" />
                                    <span className="text-xs font-semibold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                                        {route.to?.name || "End Point"}
                                    </span>
                                </div>
                            </div>
                            
                            {route.estimatedTimeMin && (
                                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>~{route.estimatedTimeMin} mins</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-gray-50 px-4 sm:px-6 py-5 overflow-y-auto">
            {/* Search Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Search Location
                </label>
                <SearchableSelect
                    options={stands}
                    value={destinationId}
                    onChange={(id) => {
                        setDestinationId(id);
                        setError(null);
                        setNearbyRoutes([]); // Clear previous results when location changes
                    }}
                    placeholder="Search a location..."
                />

                {error && (
                    <div className="mt-3 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2 border border-red-100">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    id="search-routes-btn"
                    onClick={handleSearchRoutes}
                    disabled={!destinationId || isLoading}
                    className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-[15px]">Searching...</span>
                        </>
                    ) : (
                        <>
                            <Search size={18} />
                            <span className="text-[15px]">Find Routes (2km)</span>
                        </>
                    )}
                </button>
            </div>

            {renderResults()}
        </div>
    );
}
