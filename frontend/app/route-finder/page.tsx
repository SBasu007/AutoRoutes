"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import TripPlannerPanel from "@/components/route/TripPlannerPanel";
import { useRouteStore } from "@/store/routeStore";
import { getRoutes } from "@/services/contributorService";
import { ChevronUp } from "lucide-react";

const MapView = dynamic(
    () => import("@/components/map/MapView"),
    { ssr: false }
);

const FloatingProfile = dynamic(
    () => import("@/components/ui/FloatingProfile"),
    { ssr: false }
);

export default function RouteFinderPage() {
    const { setAllRoutes } = useRouteStore();
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    useEffect(() => {
        const fetchAllRoutes = async () => {
            try {
                const routes = await getRoutes();
                setAllRoutes(routes);
            } catch (err) {
                console.error("Failed to fetch routes", err);
            }
        };

        fetchAllRoutes();
    }, [setAllRoutes]);

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden text-black font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                    {/* Map Area */}
                    <div className="absolute inset-0 md:relative md:flex-1 h-full z-0">
                        <MapView />
                        <FloatingProfile />
                    </div>

                    {/* Mobile Panel Toggle */}
                    <button
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className={`md:hidden absolute z-[1000] bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-center items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-transform duration-300 ${isPanelOpen ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
                    >
                        <ChevronUp className="text-gray-600 mr-2" />
                        <span className="font-semibold text-gray-800">Open Trip Planner</span>
                    </button>

                    {/* Interactive Panel */}
                    <div
                        className={`absolute md:relative z-[1000] md:z-10 bottom-0 left-0 right-0 md:w-[450px] bg-white md:border-l border-gray-200 shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 ease-in-out
                            ${isPanelOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                            h-[80vh] md:h-full rounded-t-3xl md:rounded-none overflow-hidden`}
                    >
                        {/* Mobile Drag Handle */}
                        <div
                            className="md:hidden flex justify-center items-center p-3 cursor-pointer shrink-0 bg-white"
                            onClick={() => setIsPanelOpen(false)}
                        >
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <TripPlannerPanel />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}