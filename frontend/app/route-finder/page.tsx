"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import NearbyRoutesList from "@/components/route/NearbyRoutesList";
import HorizontalRouteSlider from "@/components/route/HorizontalRouteSlider";
import { useRouteStore } from "@/store/routeStore";
import { getRoutes, getNearbyRoutes } from "@/services/contributorService";
import { ArrowLeft } from "lucide-react";

const MapView = dynamic(
    () => import("@/components/map/MapView"),
    { ssr: false }
);

export default function RouteFinderPage() {
    const { setAllRoutes, setUserLocation, setNearbyRoutes, showMap, setShowMap } = useRouteStore();

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

        // Get user location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLocation({ lat, lng });

                    try {
                        const nearby = await getNearbyRoutes(lat, lng, 1);
                        setNearbyRoutes(nearby);
                    } catch (err) {
                        console.error("Failed to fetch nearby routes", err);
                    }
                },
                (error) => {
                    console.error("Error getting location", error);
                }
            );
        }
    }, [setAllRoutes, setUserLocation, setNearbyRoutes]);

    return (
        <div className="h-screen flex bg-white overflow-hidden">
            <Sidebar />

            <div className="relative flex-1 h-full flex flex-col">
                {!showMap ? (
                    <NearbyRoutesList />
                ) : (
                    <>
                        {/* Map View Mode */}
                        <div className="absolute top-4 left-4 z-[1001]">
                            <button
                                onClick={() => setShowMap(false)}
                                className="flex items-center gap-2 bg-white/95 backdrop-blur shadow-md px-4 py-2 rounded-full font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to List
                            </button>
                        </div>
                        
                        <HorizontalRouteSlider />

                        <div className="flex-1 w-full relative">
                            <MapView />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}