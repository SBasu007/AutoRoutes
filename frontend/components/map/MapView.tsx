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
    } = useRouteStore();

    useEffect(() => {
        if (source && destination) {
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
    }, [source, destination, map]);

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