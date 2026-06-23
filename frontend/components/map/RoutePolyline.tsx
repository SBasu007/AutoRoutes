"use client";

import { Polyline } from "react-leaflet";
import { useRouteStore } from "@/store/routeStore";

export default function RoutePolyline() {
    const { allRoutes, selectedRoute, setSelectedRoute, tripPlan } = useRouteStore();

    // ── Trip mode: draw ONLY the trip's ride polylines + dashed walk connectors
    if (tripPlan && tripPlan.type === "trip") {
        const legs = tripPlan.legs || [];

        // Only draw routes that are part of THIS trip (hide all the others)
        const tripRouteIds = new Set(
            legs.filter((l: any) => l.type === "auto").map((l: any) => l.routeId)
        );

        const rideSegments = allRoutes
            .filter((route) => tripRouteIds.has(route.id))
            .map((route) => {
                let path: any[] = [];
                try {
                    path = route.path ? (typeof route.path === 'string' ? JSON.parse(route.path) : route.path) : [];
                } catch {
                    path = [];
                }
                const positions: [number, number][] = path.map((p: any) => [p.lat, p.lng]);
                return { route, positions };
            })
            .filter((seg) => seg.positions.length > 0);

        // Walk legs (origin→stand, transfers, stand→destination) drawn dashed
        const walkLegs = legs.filter((l: any) => l.type === "walk" && l.from && l.to);

        return (
            <>
                {/* Ride segments in indigo */}
                {rideSegments.map(({ route, positions }) => (
                    <Polyline
                        key={`ride-${route.id}`}
                        positions={positions}
                        pathOptions={{
                            color: "#4f46e5",
                            weight: 7,
                            opacity: 0.9,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                ))}

                {/* Walk connectors — dashed grey */}
                {walkLegs.map((leg: any, idx: number) => (
                    <Polyline
                        key={`walk-${idx}`}
                        positions={[
                            [leg.from.lat, leg.from.lng],
                            [leg.to.lat, leg.to.lng],
                        ]}
                        pathOptions={{
                            color: "#6b7280",
                            weight: 4,
                            opacity: 0.7,
                            dashArray: "2 10",
                            lineCap: "round",
                        }}
                    />
                ))}
            </>
        );
    }

    // ── Walk-only trip ────────────────────────────────────────────────────
    if (tripPlan && tripPlan.type === "walk_only" && tripPlan.origin && tripPlan.destination) {
        return (
            <Polyline
                positions={[
                    [tripPlan.origin.lat, tripPlan.origin.lng],
                    [tripPlan.destination.lat, tripPlan.destination.lng],
                ]}
                pathOptions={{
                    color: "#6b7280",
                    weight: 4,
                    opacity: 0.7,
                    dashArray: "2 10",
                    lineCap: "round",
                }}
            />
        );
    }

    // ── Explore mode ──────────────────────────────────────────────────────
    if (!allRoutes || allRoutes.length === 0) return null;

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

                const isSelected = selectedRoute?.id === route.id;

                return (
                    <Polyline
                        key={route.id}
                        positions={positions}
                        eventHandlers={{
                            click: () => setSelectedRoute(route)
                        }}
                        pathOptions={{
                            color: isSelected ? "#4f46e5" : "#9ca3af",
                            weight: isSelected ? 7 : 4,
                            opacity: isSelected ? 0.9 : 0.5,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                );
            })}
        </>
    );
}
