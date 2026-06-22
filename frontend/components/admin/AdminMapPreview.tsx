"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet icon fix for Next.js
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface AdminMapPreviewProps {
    type: "stand" | "route";
    payload: any;
}

function MapBoundsUpdater({ type, payload }: AdminMapPreviewProps) {
    const map = useMap();

    useEffect(() => {
        if (type === "stand" && payload?.lat && payload?.lng) {
            map.setView([payload.lat, payload.lng], 16);
        } else if (type === "route" && payload?.path) {
            try {
                const pathData = typeof payload.path === "string" ? JSON.parse(payload.path) : payload.path;
                if (pathData && pathData.length > 0) {
                    const bounds: [number, number][] = pathData.map((p: any) => [p.lat ?? p[0], p.lng ?? p[1]]);
                    map.fitBounds(bounds, { padding: [40, 40] });
                }
            } catch (err) {
                console.error("Error parsing path:", err);
            }
        }
    }, [map, type, payload]);

    return null;
}

export default function AdminMapPreview({ type, payload }: AdminMapPreviewProps) {
    if (!payload) return null;

    let pathPositions: [number, number][] = [];
    if (type === "route" && payload.path) {
        try {
            const parsed = typeof payload.path === "string" ? JSON.parse(payload.path) : payload.path;
            if (Array.isArray(parsed)) {
                pathPositions = parsed.map((p: any) => [p.lat ?? p[0], p.lng ?? p[1]]);
            }
        } catch (err) {}
    }

    // Default center for Kolkata or fallback
    const defaultCenter: [number, number] = [22.5726, 88.3639];

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden border border-white/10 z-0 my-3">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                className="h-full w-full z-0"
                scrollWheelZoom={true}
                style={{ zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapBoundsUpdater type={type} payload={payload} />

                {type === "stand" && payload.lat && payload.lng && (
                    <Marker position={[payload.lat, payload.lng]} icon={customIcon} />
                )}

                {type === "route" && pathPositions.length > 0 && (
                    <Polyline positions={pathPositions} color="#6366f1" weight={4} opacity={0.8} />
                )}
            </MapContainer>
        </div>
    );
}
