"use client";

import { useRouteStore } from "@/store/routeStore";

export default function RouteInfoPanel() {
    const { selectedRoute, setSelectedRoute } = useRouteStore();

    if (!selectedRoute) return null;

    return (
        <div className="w-full md:w-[350px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-5 relative">
            <button 
                onClick={() => setSelectedRoute(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold"
            >
                ×
            </button>
            <h2 className="text-lg font-bold text-black mb-4 pr-6">
                {selectedRoute.name || "Route Details"}
            </h2>

            <div className="space-y-4 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">From</span>
                    <span className="text-black font-semibold">
                        {selectedRoute.from?.name}
                    </span>
                </div>

                <div className="flex flex-col">
                    <span className="text-gray-500 font-medium">To</span>
                    <span className="text-black font-semibold">
                        {selectedRoute.to?.name}
                    </span>
                </div>

                {selectedRoute.estimatedTimeMin && (
                    <div className="flex justify-between mt-2 pt-2 border-t">
                        <span className="text-black font-medium">Est. Time</span>
                        <span className="text-black font-semibold">
                            {selectedRoute.estimatedTimeMin} mins
                        </span>
                    </div>
                )}
                
                {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                        <span className="text-black font-medium block mb-2">
                            Intermediate Stops
                        </span>
                        <ul className="list-disc pl-5 text-gray-700">
                            {selectedRoute.stops.map((stop: any) => (
                                <li key={stop.id}>{stop.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}