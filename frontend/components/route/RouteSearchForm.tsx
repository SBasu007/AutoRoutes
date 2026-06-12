"use client";

import { Search, ArrowDown } from "lucide-react";
import { useRouteStore } from "@/store/routeStore";
import StationSearch from "./StationSearch";
import { getRoute } from "../../services/routeService";

export default function RouteSearchForm() {
    const {
        source,
        destination,
        setSource,
        setDestination,
        setRoute,
    } = useRouteStore();

    const handleSearch = async () => {
        if (!source || !destination) return;

        const route = await getRoute(
            source.lat,
            source.lon,
            destination.lat,
            destination.lon
        );

        setRoute(route);
    };

    return (
        <div className="space-y-3">

            <StationSearch
                type="source"
                placeholder="Pickup stand"
                onSelect={setSource}
            />

            <StationSearch
                type="destination"
                placeholder="Destination stand"
                onSelect={setDestination}
            />

            <button
                onClick={handleSearch}
                className="
      w-full
      h-11
      rounded-2xl
      bg-black
      text-white
      text-sm
      font-semibold
    "
            >
                Find Route
            </button>

        </div>
    );
}