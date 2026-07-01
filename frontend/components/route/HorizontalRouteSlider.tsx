"use client";

import { useRouteStore } from "@/store/routeStore";
import { Clock } from "lucide-react";

export default function HorizontalRouteSlider() {
    const { nearbyRoutes, selectedRoute, setSelectedRoute } = useRouteStore();

    if (!nearbyRoutes || nearbyRoutes.length <= 1) return null; // Only show if there are other routes to switch to

    return (
        <div className="absolute top-20 left-4 right-4 z-[1000] md:left-6 md:right-auto md:max-w-[calc(100vw-350px)]">
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x px-1">
                {nearbyRoutes.map((route) => (
                    <button
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className={`flex-shrink-0 text-left w-64 p-4 rounded-2xl transition-all duration-300 snap-center shadow-sm ${selectedRoute?.id === route.id
                                ? "bg-blue-600 text-white border-2 border-blue-400 ring-4 ring-blue-600/20"
                                : "bg-white/95 backdrop-blur-xl text-gray-800 border-2 border-transparent hover:border-gray-200"
                            }`}
                    >
                        <h4 className={`font-bold text-sm truncate mb-2 ${selectedRoute?.id === route.id ? 'text-white' : 'text-gray-900'}`}>
                            {route.name || "Auto Route"}
                        </h4>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedRoute?.id === route.id ? 'bg-blue-200' : 'bg-blue-500'}`} />
                                <span className={`text-xs truncate font-medium ${selectedRoute?.id === route.id ? 'text-blue-50' : 'text-gray-600'}`}>
                                    {route.from?.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedRoute?.id === route.id ? 'bg-blue-200' : 'bg-red-500'}`} />
                                <span className={`text-xs truncate font-medium ${selectedRoute?.id === route.id ? 'text-blue-50' : 'text-gray-600'}`}>
                                    {route.to?.name}
                                </span>
                            </div>
                        </div>

                        {route.estimatedTimeMin && (
                            <div className={`flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold w-fit px-2 py-1 rounded-md ${selectedRoute?.id === route.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                <Clock className="w-3 h-3" />
                                <span>~{route.estimatedTimeMin} mins</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
