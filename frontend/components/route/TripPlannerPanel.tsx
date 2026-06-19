/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import { planTrip } from "@/services/tripService";
import SearchableSelect from "../ui/SearchableSelect";
import { getStands } from "@/services/contributorService";
import {
    Navigation,
    MapPin,
    Footprints,
    Bus,
    ArrowRight,
    AlertTriangle,
} from "lucide-react";

function WalkLeg({ leg }: { leg: any }) {
    const meters =
        leg.distanceKm != null
            ? (leg.distanceKm * 1000).toFixed(0)
            : null;
    return (
        <div className="relative flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex-shrink-0 relative z-10 bg-white pt-1">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm">
                    <Footprints className="w-4 h-4 text-gray-600" />
                </div>
            </div>
            <div className="flex-1 pt-1.5 pb-2">
                <p className="font-bold text-gray-900 text-lg leading-tight">{leg.instruction}</p>
                {meters && (
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        {"~" + meters + " meters"}
                    </p>
                )}
            </div>
        </div>
    );
}

function AutoLeg({ leg }: { leg: any }) {
    return (
        <div className="relative flex gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex-shrink-0 relative z-10 bg-white pt-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                    <Bus className="w-4 h-4 text-blue-600" />
                </div>
            </div>
            <div className="flex-1 pt-1.5 pb-2">
                <p className="font-bold text-gray-900 text-lg leading-tight">{leg.instruction}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <span className="truncate max-w-[120px]">{leg.fromStand?.name}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{leg.toStand?.name}</span>
                </div>
            </div>
        </div>
    );
}

export default function TripPlannerPanel() {
    const { setUserLocation, tripPlan, setTripPlan, setShowMap } = useRouteStore();
    const [stands, setStands] = useState<any[]>([]);
    const [destinationId, setDestinationId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getStands()
            .then((data) => setStands(data))
            .catch((err) => console.error("Failed to fetch stands", err));
    }, []);

    const handlePlanTrip = () => {
        if (!destinationId) {
            setError("Please select a destination first.");
            return;
        }

        setError(null);
        setTripPlan(null);
        setIsLoading(true);

        if (!("geolocation" in navigator)) {
            setError("Geolocation is not supported by your browser.");
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserLocation({ lat, lng });

                const destStand = stands.find((s) => s.id === destinationId);
                if (!destStand) {
                    setError("Invalid destination.");
                    setIsLoading(false);
                    return;
                }

                try {
                    const plan = await planTrip(lat, lng, destStand.lat, destStand.lng);
                    setTripPlan(plan);
                    setShowMap(true);
                } catch (err: any) {
                    setError(err.message || "Failed to find a route.");
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                setError("Location access denied. We need your location to plan the trip.");
                setIsLoading(false);
            }
        );
    };

    const renderResults = () => {
        if (!tripPlan) return null;

        const totalKm: number | undefined = tripPlan.totalDistanceKm;
        const apiError: string | undefined = tripPlan.error;

        return (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Your Itinerary</h3>
                    {!apiError && totalKm != null && (
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {totalKm.toFixed(1)} km total
                        </span>
                    )}
                </div>

                {apiError ? (
                    <div className="flex items-start gap-4 p-4 bg-red-50 text-red-700 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">No Route Found</p>
                            <p className="text-sm opacity-80 mt-0.5">{apiError}</p>
                        </div>
                    </div>
                ) : tripPlan.type === "walk_only" ? (
                    <div className="flex items-center gap-4 p-4 bg-green-50 text-green-800 rounded-2xl">
                        <Footprints className="w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="font-bold">{tripPlan.message}</p>
                            <p className="text-sm opacity-80">
                                {"It's only " + (totalKm != null ? totalKm.toFixed(2) : "?") + " km away."}
                            </p>
                        </div>
                    </div>
                ) : Array.isArray(tripPlan.legs) && tripPlan.legs.length > 0 ? (
                    <div className="relative">
                        <div className="absolute left-[19px] top-[24px] bottom-[24px] w-0.5 bg-gray-200" />
                        {tripPlan.legs.map((leg: any, index: number) =>
                            leg.type === "walk" ? (
                                <WalkLeg key={index} leg={leg} />
                            ) : (
                                <AutoLeg key={index} leg={leg} />
                            )
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No itinerary available.</p>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 w-full h-full p-6 md:p-10 bg-gray-50 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-100 rounded-2xl shadow-sm">
                        <Navigation className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                            Trip Planner
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Find the best auto route to your destination
                        </p>
                    </div>
                </div>

                {/* Search Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Where to?
                            </label>
                            <SearchableSelect
                                options={stands}
                                value={destinationId}
                                onChange={(id) => {
                                    setDestinationId(id);
                                    setTripPlan(null);
                                    setError(null);
                                }}
                                placeholder="Search for destination stand..."
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            id="plan-trip-btn"
                            onClick={handlePlanTrip}
                            disabled={!destinationId || isLoading}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 shadow-md"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Locating and Planning...</span>
                                </>
                            ) : (
                                <>
                                    <MapPin size={18} />
                                    <span>Find Route from Current Location</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {renderResults()}
            </div>
        </div>
    );
}
