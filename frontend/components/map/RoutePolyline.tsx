"use client";

import { Polyline } from "react-leaflet";
import { useRouteStore } from "@/store/routeStore";

export default function RoutePolyline() {
    const { allRoutes, selectedRoute, setSelectedRoute, tripPlan } = useRouteStore();

    if (!allRoutes || allRoutes.length === 0) return null;

    const tripRouteIds = new Set(
        tripPlan?.legs?.filter((l: any) => l.type === "auto").map((l: any) => l.routeId) || []
    );

    return (
        <>
            {allRoutes.map((route) => {
                let path = [];
                try {
                    path = route.path ? typeof route.path === 'string' ? JSON.parse(route.path) : route.path : [];
                } catch {
                    path = [];
                }

                if (path.length === 0) return null;

                const positions: [number, number][] = path.map(
                    (p: any): [number, number] => [p.lat, p.lng]
                );
                
                let isSelected = false;
                if (tripPlan) {
                    isSelected = tripRouteIds.has(route.id);
                } else {
                    isSelected = selectedRoute?.id === route.id;
                }

                // If tripPlan is active, hide non-trip routes to reduce clutter
                if (tripPlan && !isSelected) return null;

                return (
                    <Polyline
                        key={route.id}
                        positions={positions}
                        eventHandlers={{
                            click: () => !tripPlan && setSelectedRoute(route)
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