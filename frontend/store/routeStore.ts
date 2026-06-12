"use client";

import { create } from "zustand";
import { Station } from "@/types/station";

interface RouteStore {
    source: Station | null;
    destination: Station | null;
    currentRoute: any | null;
    allRoutes: any[];
    selectedRoute: any | null;

    setSource: (station: Station | null) => void;
    setDestination: (station: Station | null) => void;
    setRoute: (route: any | null) => void;
    setAllRoutes: (routes: any[]) => void;
    setSelectedRoute: (route: any | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
    source: null,
    destination: null,
    currentRoute: null,
    allRoutes: [],
    selectedRoute: null,

    setSource: (station) => set({ source: station }),
    setDestination: (station) => set({ destination: station }),
    setRoute: (route) => set({ currentRoute: route }),
    setAllRoutes: (routes) => set({ allRoutes: routes }),
    setSelectedRoute: (route) => set({ selectedRoute: route }),
}));