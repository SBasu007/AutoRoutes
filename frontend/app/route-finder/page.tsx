"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import TripPlannerPanel from "@/components/route/TripPlannerPanel";
import { useRouteStore } from "@/store/routeStore";
import { getRoutes } from "@/services/contributorService";
import { Navigation, ChevronUp } from "lucide-react";

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
                {/* Top Header */}
                <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-[1100] shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 leading-none tracking-tight">Find Routes</h1>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Best auto &amp; shared routes near you</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                    {/* Map Area */}
                    <div className="absolute inset-0 md:relative md:flex-1 h-full z-0">
                        <MapView />
                        <div className="hidden md:block">
                            <FloatingProfile />
                        </div>
                    </div>

                    {/* Floating reopen pill — sits ABOVE the bottom nav */}
                    {!isPanelOpen && (
                        <button
                            onClick={() => setIsPanelOpen(true)}
                            className="md:hidden absolute z-[1500] left-1/2 -translate-x-1/2 bottom-24 flex items-center gap-2 bg-gray-900 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl active:scale-95 transition-transform cursor-pointer"
                        >
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-sm font-bold">Where to?</span>
                        </button>
                    )}

                    {/* Interactive Panel */}
                    <div
                        className={`absolute md:relative z-[1000] md:z-10 bottom-0 left-0 right-0 md:w-[440px] bg-white md:border-l border-gray-200 shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 ease-out
                            ${isPanelOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                            h-[82vh] md:h-full rounded-t-3xl md:rounded-none overflow-hidden`}
                    >
                        {/* Mobile Drag Handle */}
                        <div className="md:hidden flex justify-center items-center pt-3 pb-1.5 shrink-0 bg-white">
                            <button
                                onClick={() => setIsPanelOpen(false)}
                                aria-label="Close panel"
                                className="w-10 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors cursor-pointer"
                            />
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
