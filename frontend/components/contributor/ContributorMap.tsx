"use client";

import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const startIcon = new L.Icon({
    iconUrl:
        "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35],
});

const endIcon = new L.Icon({
    iconUrl:
        "https://cdn-icons-png.flaticon.com/512/149/149059.png",
    iconSize: [35, 35],
});

type Props = {
    stands: any[];
    routes: any[];
    onMapClick: (lat: number, lng: number) => void;
    tempMarker: { lat: number; lng: number } | null;
    routePath: Array<{ lat: number; lng: number }>;
    selectedFrom?: number | null;
    selectedTo?: number | null;
    selectedStops?: number[];
};

function MapClickHandler({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });

    return null;
}

export default function ContributorMap({
    stands,
    routes,
    onMapClick,
    tempMarker,
    routePath,
    selectedFrom,
    selectedTo,
    selectedStops,
}: Props) {
    const fromStand = stands.find(
        (s) => s.id === selectedFrom
    );

    const toStand = stands.find(
        (s) => s.id === selectedTo
    );

    return (
        <MapContainer
            center={[22.5726, 88.3639]}
            zoom={13}
            className="h-full w-full"
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            <MapClickHandler onMapClick={onMapClick} />

            {/* Existing Stands */}
            {stands.map((stand) => (
                <Marker
                    key={stand.id}
                    position={[stand.lat, stand.lng]}
                />
            ))}

            {/* Temporary Marker */}
            {tempMarker && (
                <Marker
                    position={[
                        tempMarker.lat,
                        tempMarker.lng,
                    ]}
                />
            )}

            {/* Start Stand */}
            {fromStand && (
                <Marker
                    position={[
                        fromStand.lat,
                        fromStand.lng,
                    ]}
                    icon={startIcon}
                />
            )}

            {/* End Stand */}
            {toStand && (
                <Marker
                    position={[
                        toStand.lat,
                        toStand.lng,
                    ]}
                    icon={endIcon}
                />
            )}

            {selectedStops?.map((stopId) => {
                const stop = stands.find(
                    s => s.id === stopId
                );

                if (!stop) return null;

                return (
                    <Marker
                        key={`stop-${stop.id}`}
                        position={[
                            stop.lat,
                            stop.lng,
                        ]}
                    />
                );
            })}

            {/* Existing Saved Routes */}
            {routes.map((route) => {
                let path = [];

                try {
                    path = route.path
                        ? JSON.parse(route.path)
                        : [];
                } catch {
                    path = [];
                }

                return (
                    <Polyline
                        key={route.id}
                        positions={path.map(
                            (p: any) => [p.lat, p.lng]
                        )}
                        color="#2563eb"
                        weight={5}
                        opacity={0.7}
                    />
                );
            })}

            {/* Live Generated Route */}
            {routePath.length > 0 && (
                <Polyline
                    positions={routePath.map((p) => [
                        p.lat,
                        p.lng,
                    ])}
                    color="#ef4444"
                    weight={6}
                />
            )}
        </MapContainer>
    );
}