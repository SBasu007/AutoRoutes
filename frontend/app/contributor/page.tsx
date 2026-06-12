"use client";

import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { getStands, getRoutes, addStand as addStandService, addRoute as addRouteService } from "../../services/contributorService";
import { MapPin, Plus, Route, Save } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("../../components/contributor/ContributorMap"), { ssr: false });

type Stand = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    type: "auto_stand" | "destination" | "stop";
};

type RouteType = {
    id?: number;
    fromStandId: number;
    toStandId: number;
    name?: string;
    estimatedTimeMin?: number;
    path: Array<{
        lat: number;
        lng: number;
    }>;
    stops?: {
        id: number;
        name: string;
        lat: number;
        lng: number;
        stopOrder: number;
    }[];
};

export default function ContributorPage() {
    const [stands, setStands] = useState<Stand[]>([]);
    const [routes, setRoutes] = useState<RouteType[]>([]);
    const [selectedMode, setSelectedMode] = useState<"stand" | "route">("stand");

    // For adding Stand
    const [newStand, setNewStand] = useState({
        name: "",
        type: "auto_stand" as const,
        address: "",
    });
    const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);

    // For creating Route
    const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
    const [selectedTo, setSelectedTo] = useState<number | null>(null);
    const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
    const [routeName, setRouteName] = useState("");
    const [estimatedTime, setEstimatedTime] = useState<number>(30);
    const [selectedStops, setSelectedStops] = useState<number[]>([]);

    const getSegmentRoute = async (
        fromLat: number,
        fromLng: number,
        toLat: number,
        toLng: number
    ) => {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
        );

        const data = await res.json();

        if (!data.routes?.length) return [];

        return data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({
                lat,
                lng,
            })
        );
    };

    // Fetch all data
    const fetchData = async () => {
        try {
            const [standsData, routesData] = await Promise.all([
                getStands(),
                getRoutes(),
            ]);
            setStands(standsData);
            setRoutes(routesData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const generateRoute = async () => {
            if (!selectedFrom || !selectedTo) return;

            const stopIds = [
                selectedFrom,
                ...selectedStops.filter(id => id > 0),
                selectedTo,
            ];

            const stopObjects = stopIds
                .map(id => stands.find(s => s.id === id))
                .filter(Boolean);

            if (stopObjects.length < 2) return;

            let fullPath: Array<{
                lat: number;
                lng: number;
            }> = [];

            for (
                let i = 0;
                i < stopObjects.length - 1;
                i++
            ) {
                const segment =
                    await getSegmentRoute(
                        stopObjects[i]!.lat,
                        stopObjects[i]!.lng,
                        stopObjects[i + 1]!.lat,
                        stopObjects[i + 1]!.lng
                    );

                fullPath.push(...segment);
            }

            setRoutePath(fullPath);
        };

        generateRoute();
    }, [
        selectedFrom,
        selectedTo,
        selectedStops,
        stands,
    ]);

    const handleMapClick = (lat: number, lng: number) => {
        setTempMarker({ lat, lng });

        if (selectedMode === "route" && routePath.length < 20) {
            setRoutePath((prev) => [...prev, { lat, lng }]);
        }
    };

    // Add New Stand
    const addStand = async () => {
        if (!tempMarker || !newStand.name) return alert("Please fill name and click on map");

        try {
            await addStandService({
                ...newStand,
                lat: tempMarker.lat,
                lng: tempMarker.lng,
            });
            alert("Stand added successfully!");
            setNewStand({ name: "", type: "auto_stand", address: "" });
            setTempMarker(null);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Failed to add stand.");
        }
    };

    // Create Route with custom path
    const createRoute = async () => {
        if (
            !selectedFrom ||
            !selectedTo ||
            routePath.length === 0
        ) {
            return alert("Select From and To stand");
        }

        try {
            await addRouteService({
                fromStandId: selectedFrom,
                toStandId: selectedTo,
                stops: selectedStops.filter(s => s > 0),
                name: routeName || `${stands.find(s => s.id === selectedFrom)?.name} → ${stands.find(s => s.id === selectedTo)?.name}`,
                path: routePath,
                estimatedTimeMin: estimatedTime,
            });
            alert("Route created successfully!");
            setSelectedFrom(null);
            setSelectedTo(null);
            setSelectedStops([]);
            setRoutePath([]);
            setRouteName("");
            fetchData();
        } catch (error: any) {
            alert(error.message || "Failed to create route.");
        }
    };

    return (
        <div className="h-screen flex overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white border-b p-4 flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Contributor Panel - Kolkata Auto Routes</h1>

                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => setSelectedMode("stand")}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedMode === "stand" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                        >
                            <MapPin size={18} /> Add Stand
                        </button>
                        <button
                            onClick={() => setSelectedMode("route")}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selectedMode === "route" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                        >
                            <Route size={18} /> Create Route
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Map Area */}
                    <div className="flex-1 relative">
                        <Map
                            stands={stands}
                            routes={routes}
                            onMapClick={handleMapClick}
                            tempMarker={tempMarker}
                            routePath={routePath}
                            selectedFrom={selectedFrom}
                            selectedTo={selectedTo}
                            selectedStops={selectedStops}
                        />
                    </div>

                    {/* Side Panel */}
                    <div className="w-96 bg-white border-l overflow-y-auto">
                        {selectedMode === "stand" && (
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Add New Stand</h2>

                                <input
                                    type="text"
                                    placeholder="Stand Name (e.g. Garia Auto Stand)"
                                    className="w-full p-3 border rounded-lg mb-3"
                                    value={newStand.name}
                                    onChange={(e) => setNewStand({ ...newStand, name: e.target.value })}
                                />

                                <select
                                    className="w-full p-3 border rounded-lg mb-3"
                                    value={newStand.type}
                                    onChange={(e) => setNewStand({ ...newStand, type: e.target.value as any })}
                                >
                                    <option value="auto_stand">Auto Stand</option>
                                    <option value="destination">Destination</option>
                                    <option value="stop">Stop</option>
                                </select>

                                <input
                                    type="text"
                                    placeholder="Address (Optional)"
                                    className="w-full p-3 border rounded-lg mb-4"
                                    value={newStand.address}
                                    onChange={(e) => setNewStand({ ...newStand, address: e.target.value })}
                                />

                                <button
                                    onClick={addStand}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                                >
                                    <Save size={20} /> Save Stand
                                </button>

                                <p className="text-sm text-gray-500 mt-4">
                                    Click anywhere on the map to place the stand
                                </p>
                            </div>
                        )}

                        {selectedMode === "route" && (
                            <div className="p-6 space-y-6">
                                <h2 className="text-xl font-semibold">Create New Route</h2>

                                <div>
                                    <label className="block text-sm mb-1">From Stand</label>
                                    <select
                                        className="w-full p-3 border rounded-lg"
                                        value={selectedFrom || ""}
                                        onChange={(e) => setSelectedFrom(Number(e.target.value))}
                                    >
                                        <option value="">Select From</option>
                                        {stands.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">
                                        Intermediate Stops
                                    </label>

                                    {selectedStops.map((stopId, index) => (
                                        <select
                                            key={index}
                                            className="w-full p-3 border rounded-lg mb-2"
                                            value={stopId}
                                            onChange={(e) => {
                                                const updated = [...selectedStops];
                                                updated[index] = Number(e.target.value);
                                                setSelectedStops(updated);
                                            }}
                                        >
                                            <option value="">Select Stop</option>

                                            {stands.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    ))}

                                    <button
                                        type="button"
                                        className="mt-2 px-4 py-2 bg-gray-100 rounded"
                                        onClick={() =>
                                            setSelectedStops([...selectedStops, 0])
                                        }
                                    >
                                        + Add Stop
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">To Stand</label>
                                    <select
                                        className="w-full p-3 border rounded-lg"
                                        value={selectedTo || ""}
                                        onChange={(e) => setSelectedTo(Number(e.target.value))}
                                    >
                                        <option value="">Select To</option>
                                        {stands.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Route Name (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg"
                                        value={routeName}
                                        onChange={(e) => setRouteName(e.target.value)}
                                        placeholder="e.g. Garia to Howrah Station"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Estimated Time (minutes)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 border rounded-lg"
                                        value={estimatedTime}
                                        onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                    />
                                </div>

                                <button
                                    onClick={createRoute}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                                >
                                    <Route size={20} /> Save Route with Custom Path
                                </button>

                                <p className="text-sm text-gray-500">
                                    Route will be generated automatically using road network
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}