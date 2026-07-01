"use client";

import { Marker, Popup, CircleMarker } from "react-leaflet";
import { useRouteStore } from "@/store/routeStore";
import L from "leaflet";

// ── Custom Uber/Rapido-style icons ─────────────────────────────────────────
// Origin: a glowing green dot (the user's current location).
const originIcon = L.divIcon({
    className: "trip-origin-marker",
    html: `
        <div class="origin-dot-wrap">
            <span class="origin-pulse"></span>
            <span class="origin-dot"></span>
        </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Destination: a red pin with a white inner dot.
const destinationIcon = L.divIcon({
    className: "trip-dest-marker",
    html: `
        <div class="dest-pin-wrap">
            <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 1C8.7 1 2 7.7 2 16c0 10.5 13.5 26 15 27.7C18.5 42 32 26.5 32 16 32 7.7 25.3 1 17 1z" fill="#ef4444" stroke="#fff" stroke-width="2.5"/>
                <circle cx="17" cy="16" r="6" fill="#fff"/>
            </svg>
        </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -36],
});

// Intermediate auto-leg endpoint marker (small numbered blue circle).
const makeStopIcon = (label: string) =>
    L.divIcon({
        className: "trip-stop-marker",
        html: `<div class="stop-circle">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });

export default function MarkerLayer() {
    const { selectedRoute, tripPlan, userLocation } = useRouteStore();

    // ── Trip-mode markers (when a trip is planned) ────────────────────────
    if (tripPlan && tripPlan.type === "trip" && tripPlan.origin && tripPlan.destination) {
        // Collect intermediate auto-leg endpoints (board / alight stands)
        const autoLegs = (tripPlan.legs || []).filter((l: any) => l.type === "auto");

        return (
            <>
                {/* Origin — user's location (green glowing dot) */}
                <Marker position={[tripPlan.origin.lat, tripPlan.origin.lng]} icon={originIcon} zIndexOffset={1000}>
                    <Popup>
                        <div className="min-w-[120px]">
                            <h3 className="font-bold text-green-600 text-sm flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                You are here
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Start of your trip</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Intermediate board/alight stands */}
                {autoLegs.map((leg: any, idx: number) => (
                    <div key={`stops-${idx}`}>
                        <Marker
                            position={[leg.fromStand.lat, leg.fromStand.lng]}
                            icon={makeStopIcon(String.fromCharCode(65 + idx))}
                        >
                            <Popup>
                                <div className="min-w-[120px]">
                                    <h3 className="font-bold text-blue-600 text-sm">Board auto here</h3>
                                    <p className="text-xs text-gray-600 mt-0.5 font-medium">{leg.fromStand.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                        <Marker
                            position={[leg.toStand.lat, leg.toStand.lng]}
                            icon={makeStopIcon(String.fromCharCode(65 + idx + 1))}
                        >
                            <Popup>
                                <div className="min-w-[120px]">
                                    <h3 className="font-bold text-blue-600 text-sm">Get off here</h3>
                                    <p className="text-xs text-gray-600 mt-0.5 font-medium">{leg.toStand.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                    </div>
                ))}

                {/* Destination — red pin */}
                <Marker position={[tripPlan.destination.lat, tripPlan.destination.lng]} icon={destinationIcon} zIndexOffset={999}>
                    <Popup>
                        <div className="min-w-[120px]">
                            <h3 className="font-bold text-red-600 text-sm">Destination</h3>
                            <p className="text-xs text-gray-500 mt-1">End of your trip</p>
                        </div>
                    </Popup>
                </Marker>
            </>
        );
    }

    // ── Walk-only trip: origin + destination only ─────────────────────────
    if (tripPlan && tripPlan.type === "walk_only" && tripPlan.origin && tripPlan.destination) {
        return (
            <>
                <Marker position={[tripPlan.origin.lat, tripPlan.origin.lng]} icon={originIcon} zIndexOffset={1000}>
                    <Popup>
                        <div className="min-w-[120px]">
                            <h3 className="font-bold text-green-600 text-sm">You are here</h3>
                        </div>
                    </Popup>
                </Marker>
                <Marker position={[tripPlan.destination.lat, tripPlan.destination.lng]} icon={destinationIcon}>
                    <Popup>
                        <div className="min-w-[120px]">
                            <h3 className="font-bold text-red-600 text-sm">Destination</h3>
                        </div>
                    </Popup>
                </Marker>
            </>
        );
    }

    // ── Explore mode (a route was clicked, no trip planned) ───────────────
    if (!selectedRoute) {
        // Still show the user's location if available
        if (userLocation) {
            return (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={originIcon} zIndexOffset={1000} />
            );
        }
        return null;
    }

    const from = selectedRoute.from;
    const to = selectedRoute.to;
    const stops = selectedRoute.stops || [];

    return (
        <>
            {from && (
                <Marker position={[from.lat, from.lng]} icon={originIcon} zIndexOffset={1000}>
                    <Popup>
                        <div>
                            <h3 className="font-bold text-green-600">Start</h3>
                            <p className="text-sm">{from.name}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {stops.map((stop: any) => (
                <Marker key={`stop-${stop.id}`} position={[stop.lat, stop.lng]} icon={makeStopIcon("#")}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-gray-600">Stop #{stop.stopOrder}</h3>
                            <p className="text-sm">{stop.name}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {to && (
                <Marker position={[to.lat, to.lng]} icon={destinationIcon}>
                    <Popup>
                        <div>
                            <h3 className="font-bold text-red-600">Destination</h3>
                            <p className="text-sm">{to.name}</p>
                        </div>
                    </Popup>
                </Marker>
            )}
        </>
    );
}
