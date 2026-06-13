"use client";

import { Polyline } from "react-leaflet";
import { useRouteStore } from "@/store/routeStore";

export default function RoutePolyline() {
    const { allRoutes, selectedRoute, setSelectedRoute } = useRouteStore();

    if (!allRoutes || allRoutes.length === 0) return null;

    return (
        <>
            {allRoutes.map((route) => {
                let path = [];
                try {
                    path = route.path ? JSON.parse(route.path) : [];
                } catch {
                    path = [];
                }

                if (path.length === 0) return null;

                const positions: [number, number][] = path.map(
                    (p: any): [number, number] => [p.lat, p.lng]
                );
                
                const isSelected = selectedRoute?.id === route.id;

                return (
                    <Polyline
                        key={route.id}
                        positions={positions}
                        eventHandlers={{
                            click: () => setSelectedRoute(route)
                        }}
                        pathOptions={{
                            color: isSelected ? "#ef4444" : "#9ca3af",
                            weight: isSelected ? 8 : 4,
                            opacity: isSelected ? 1 : 0.5,
                        }}
                    />
                );
            })}
        </>
    );
}