"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";

import {
    MapContainer,
    TileLayer,
    useMap,
} from "react-leaflet";

import { useRouteStore } from "@/store/routeStore";

import MarkerLayer from "./MarkerLayer";
import RoutePolyline from "./RoutePolyline";

import "@/lib/leaflet";

function MapUpdater() {
    const map = useMap();

    const {
        source,
        destination,
        selectedRoute,
        tripPlan,
    } = useRouteStore();

    useEffect(() => {
        // 1. Trip planned — frame origin → destination (covers whole journey)
        if (tripPlan && tripPlan.origin && tripPlan.destination) {
            map.fitBounds(
                [
                    [tripPlan.origin.lat, tripPlan.origin.lng],
                    [tripPlan.destination.lat, tripPlan.destination.lng],
                ],
                { padding: [80, 80], maxZoom: 15 }
            );
            return;
        }

        // 2. A route was clicked in explore mode
        if (selectedRoute) {
            let path = [];
            try {
                path = selectedRoute.path ? JSON.parse(selectedRoute.path) : [];
            } catch {}

            if (path.length > 0) {
                const bounds: [number, number][] = path.map((p: any) => [p.lat, p.lng]);
                map.fitBounds(bounds, { padding: [80, 80] });
            } else if (selectedRoute.from && selectedRoute.to) {
                map.fitBounds(
                    [
                        [selectedRoute.from.lat, selectedRoute.from.lng],
                        [selectedRoute.to.lat, selectedRoute.to.lng],
                    ],
                    { padding: [80, 80] }
                );
            }
        } else if (source && destination) {
            map.fitBounds(
                [
                    [source.lat, source.lon],
                    [destination.lat, destination.lon],
                ],
                {
                    padding: [60, 60],
                }
            );
        }
    }, [source, destination, selectedRoute, tripPlan, map]);

    return null;
}

export default function MapView() {
    return (
        <MapContainer
            center={[22.5726, 88.3639]}
            zoom={13}
            className="h-full w-full z-0"
            zoomControl={false}
        >
            <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater />

            <MarkerLayer />

            <RoutePolyline />
        </MapContainer>
    );
}