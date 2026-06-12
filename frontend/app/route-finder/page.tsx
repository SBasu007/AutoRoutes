"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import RouteInfoPanel from "@/components/route/RouteInfoPanel";
import { useRouteStore } from "@/store/routeStore";
import { getRoutes } from "@/services/contributorService";

const MapView = dynamic(
    () => import("@/components/map/MapView"),
    { ssr: false }
);

export default function RouteFinderPage() {
    const { setAllRoutes } = useRouteStore();

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
        <div className="h-screen flex bg-white">
            <Sidebar />

            <div className="relative flex-1">
                {/* Full Screen Map */}
                <MapView />

                {/* Floating Route Info */}
                <div className="absolute bottom-24 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-[1000]">
                    <RouteInfoPanel />
                </div>
            </div>
        </div>
    );
}