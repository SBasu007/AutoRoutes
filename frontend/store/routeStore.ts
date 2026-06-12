"use client";

import { create } from "zustand";

interface RouteStore {
    allRoutes: any[];
    selectedRoute: any | null;

    setAllRoutes: (routes: any[]) => void;
    setSelectedRoute: (route: any | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
    allRoutes: [],
    selectedRoute: null,

    setAllRoutes: (routes) => set({ allRoutes: routes }),
    setSelectedRoute: (route) => set({ selectedRoute: route }),
}));