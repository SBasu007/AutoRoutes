"use client";

import { Marker, Popup } from "react-leaflet";
import { useRouteStore } from "@/store/routeStore";

export default function MarkerLayer() {
    const { selectedRoute } = useRouteStore();

    if (!selectedRoute) return null;

    const from = selectedRoute.from;
    const to = selectedRoute.to;
    const stops = selectedRoute.stops || [];

    return (
        <>
            {from && (
                <Marker position={[from.lat, from.lng]}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-green-600">Start</h3>
                            <p>{from.name}</p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {stops.map((stop: any) => (
                <Marker key={`stop-${stop.id}`} position={[stop.lat, stop.lng]}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-gray-600">Stop #{stop.stopOrder}</h3>
                            <p>{stop.name}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {to && (
                <Marker position={[to.lat, to.lng]}>
                    <Popup>
                        <div>
                            <h3 className="font-semibold text-red-600">Destination</h3>
                            <p>{to.name}</p>
                        </div>
                    </Popup>
                </Marker>
            )}
        </>
    );
}