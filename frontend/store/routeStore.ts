"use client";

import { create } from "zustand";
import { Station } from "@/types/station";

interface RouteStore {
    source: Station | null;
    destination: Station | null;
    currentRoute: any | null;
    allRoutes: any[];
    selectedRoute: any | null;
    userLocation: { lat: number; lng: number } | null;
    nearbyRoutes: any[];
    showMap: boolean;

    setSource: (station: Station | null) => void;
    setDestination: (station: Station | null) => void;
    setRoute: (route: any | null) => void;
    setAllRoutes: (routes: any[]) => void;
    setSelectedRoute: (route: any | null) => void;
    setUserLocation: (location: { lat: number; lng: number } | null) => void;
    setNearbyRoutes: (routes: any[]) => void;
    setShowMap: (show: boolean) => void;
    
    tripPlan: any | null;
    setTripPlan: (plan: any | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
    source: null,
    destination: null,
    currentRoute: null,
    allRoutes: [],
    selectedRoute: null,
    userLocation: null,
    nearbyRoutes: [],
    showMap: false,

    setSource: (station) => set({ source: station }),
    setDestination: (station) => set({ destination: station }),
    setRoute: (route) => set({ currentRoute: route }),
    setAllRoutes: (routes) => set({ allRoutes: routes }),
    setSelectedRoute: (route) => set({ selectedRoute: route }),
    setUserLocation: (location) => set({ userLocation: location }),
    setNearbyRoutes: (routes) => set({ nearbyRoutes: routes }),
    setShowMap: (show) => set({ showMap: show }),
    
    tripPlan: null,
    setTripPlan: (plan) => set({ tripPlan: plan }),
}));