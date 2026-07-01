"use client";

import { useRouteStore } from "@/store/routeStore";
import { Clock, MapPin, Navigation } from "lucide-react";

export default function NearbyRoutesList() {
    const { nearbyRoutes, setSelectedRoute, selectedRoute, userLocation, setShowMap } = useRouteStore();

    if (!userLocation) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 w-full h-full">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Acquiring your location...</p>
        </div>
    );

    return (
        <div className="flex-1 w-full h-full p-6 md:p-10 bg-gray-50 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-2xl shadow-sm">
                            <Navigation className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">Nearby Routes</h2>
                            <p className="text-sm text-gray-500 font-medium mt-1">Available within 1km of your current location</p>
                        </div>
                    </div>
                    {nearbyRoutes.length > 0 && (
                        <span className="bg-white text-blue-600 text-sm font-bold px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                            {nearbyRoutes.length} Routes Found
                        </span>
                    )}
                </div>

                {nearbyRoutes.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No routes nearby</h3>
                        <p className="text-gray-500 font-medium">We couldn't find any auto routes within 1km of your location right now.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {nearbyRoutes.map((route) => (
                            <button
                                key={route.id}
                                onClick={() => {
                                    setSelectedRoute(route);
                                    setShowMap(true);
                                }}
                                className={`w-full text-left p-5 rounded-[24px] transition-all duration-300 group bg-white border hover:-translate-y-1 ${selectedRoute?.id === route.id
                                        ? "border-blue-500 shadow-[0_8px_24px_rgba(59,130,246,0.2)] ring-4 ring-blue-500/10"
                                        : "border-gray-100 hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                                    }`}
                            >
                                <h3 className={`font-bold text-lg mb-4 truncate ${selectedRoute?.id === route.id ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                    {route.name || "Auto Route"}
                                </h3>

                                <div className="flex flex-col gap-3 relative mb-5">
                                    {/* Vertical line connecting the dots */}
                                    <div className="absolute left-[7px] top-[14px] bottom-[14px] w-0.5 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors" />

                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 z-10 ring-4 ring-white shadow-sm" />
                                        <span className="text-sm font-semibold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                                            {route.from?.name || "Start Point"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 z-10 ring-4 ring-white shadow-sm" />
                                        <span className="text-sm font-semibold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                                            {route.to?.name || "End Point"}
                                        </span>
                                    </div>
                                </div>

                                {route.estimatedTimeMin && (
                                    <div className={`flex items-center gap-1.5 text-xs font-bold w-fit px-3 py-2 rounded-xl transition-colors ${selectedRoute?.id === route.id
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                                        }`}>
                                        <Clock className="w-4 h-4" />
                                        <span>~{route.estimatedTimeMin} mins</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
