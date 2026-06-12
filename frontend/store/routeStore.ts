"use client";

import { create } from "zustand";
import { Station } from "@/types/station";

interface RouteStore {
    source: Station | null;
    destination: Station | null;
    allRoutes: any[];
    selectedRoute: any | null;

    setSource: (station: Station | null) => void;
    setDestination: (station: Station | null) => void;
    setAllRoutes: (routes: any[]) => void;
    setSelectedRoute: (route: any | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
    source: null,
    destination: null,
    allRoutes: [],
    selectedRoute: null,

    setSource: (station) => set({ source: station }),
    setDestination: (station) => set({ destination: station }),
    setAllRoutes: (routes) => set({ allRoutes: routes }),
    setSelectedRoute: (route) => set({ selectedRoute: route }),
}));