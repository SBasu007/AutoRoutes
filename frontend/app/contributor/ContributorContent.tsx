"use client";

import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getStands, getRoutes, addStand as addStandService, addRoute as addRouteService } from "../../services/contributorService";
import { MapPin, Route as RouteIcon, Save, ArrowRight, ArrowLeft, ChevronUp, Plus, Trash2, LogOut, User, Users } from "lucide-react";
import SearchableSelect from "../../components/ui/SearchableSelect";
import { useAuthStore } from "../../store/authStore";

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
    const { token, user, logout } = useAuthStore();
    const router = useRouter();
    const [stands, setStands] = useState<Stand[]>([]);
    const [routes, setRoutes] = useState<RouteType[]>([]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Step 1: Manage Stands, Step 2: Create Route
    const [step, setStep] = useState<1 | 2>(1);

    // Mobile bottom sheet state
    const [isPanelOpen, setIsPanelOpen] = useState(true);

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
    const [selectedStops, setSelectedStops] = useState<(number | null)[]>([]);

    const getSegmentRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (!data.routes?.length) return [];
        return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    };

    const fetchData = async () => {
        try {
            const [standsData, routesData] = await Promise.all([getStands(), getRoutes()]);
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
                ...selectedStops.filter(id => id !== null) as number[],
                selectedTo,
            ];

            const stopObjects = stopIds
                .map(id => stands.find(s => s.id === id))
                .filter(Boolean) as Stand[];

            if (stopObjects.length < 2) return;

            let fullPath: Array<{ lat: number; lng: number }> = [];

            for (let i = 0; i < stopObjects.length - 1; i++) {
                const segment = await getSegmentRoute(
                    stopObjects[i].lat,
                    stopObjects[i].lng,
                    stopObjects[i + 1].lat,
                    stopObjects[i + 1].lng
                );
                fullPath.push(...segment);
            }

            setRoutePath(fullPath);
        };

        generateRoute();
    }, [selectedFrom, selectedTo, selectedStops, stands]);

    const handleMapClick = (lat: number, lng: number) => {
        if (step === 1) {
            setTempMarker({ lat, lng });
        } else if (step === 2 && routePath.length < 20) {
            // Optional: allow adding custom waypoints
            setRoutePath((prev) => [...prev, { lat, lng }]);
        }
    };

    const addStand = async () => {
        if (!tempMarker || !newStand.name) return alert("Please fill name and click on map");
        try {
            await addStandService({
                ...newStand,
                lat: tempMarker.lat,
                lng: tempMarker.lng,
            }, token || undefined);
            alert("Stand added! An admin will review it shortly.");
            setNewStand({ name: "", type: "auto_stand", address: "" });
            setTempMarker(null);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Failed to add stand.");
        }
    };

    const createRoute = async () => {
        if (!selectedFrom || !selectedTo || routePath.length === 0) {
            return alert("Select From and To stand");
        }
        try {
            await addRouteService({
                fromStandId: selectedFrom,
                toStandId: selectedTo,
                stops: selectedStops.filter(s => s !== null) as number[],
                name: routeName || `${stands.find(s => s.id === selectedFrom)?.name} → ${stands.find(s => s.id === selectedTo)?.name}`,
                path: routePath,
                estimatedTimeMin: estimatedTime,
            }, token || undefined);
            alert("Route created! An admin will review it shortly.");
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
        <div className="h-screen flex bg-gray-50 overflow-hidden text-black font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between z-[1100] shrink-0 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 leading-none tracking-tight">Contributor</h1>
                            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 hidden sm:block">Help build the Kolkata Auto network</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {user && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                                <User size={14} className="text-gray-500" />
                                <span className="font-semibold text-gray-700">{user.username}</span>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 active:bg-red-100 transition-all shadow-sm cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                    {/* Map Area */}
                    <div className="absolute inset-0 md:relative md:flex-1 h-full z-0">
                        <Map
                            stands={stands}
                            routes={routes}
                            onMapClick={handleMapClick}
                            tempMarker={tempMarker}
                            routePath={routePath}
                            selectedFrom={selectedFrom}
                            selectedTo={selectedTo}
                            selectedStops={selectedStops as number[]}
                        />
                    </div>

                    {/* Floating reopen pill — sits ABOVE the bottom nav */}
                    {!isPanelOpen && (
                        <button
                            onClick={() => setIsPanelOpen(true)}
                            className="md:hidden absolute z-[1500] left-1/2 -translate-x-1/2 bottom-24 flex items-center gap-2 bg-gray-900 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl active:scale-95 transition-transform cursor-pointer"
                        >
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-sm font-bold">Open Contributor Tools</span>
                        </button>
                    )}

                    {/* Interactive Panel */}
                    <div
                        className={`absolute md:relative z-[1000] md:z-10 bottom-0 left-0 right-0 md:w-[420px] bg-white md:border-l border-gray-200 shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 ease-out
                            ${isPanelOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                            h-[82vh] md:h-full rounded-t-3xl md:rounded-none overflow-hidden`}
                    >
                        {/* Mobile Drag Handle */}
                        <div className="md:hidden flex justify-center items-center pt-3 pb-1.5 shrink-0 bg-white">
                            <button
                                onClick={() => setIsPanelOpen(false)}
                                aria-label="Close panel"
                                className="w-10 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors cursor-pointer"
                            />
                        </div>

                        {/* Wizard Header */}
                        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold tracking-wider uppercase ${step === 1 ? 'text-blue-600' : 'text-gray-400'}`}>Step 1 · Stands</span>
                                <span className="text-gray-300">❯</span>
                                <span className={`text-xs font-bold tracking-wider uppercase ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>Step 2 · Routes</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                            </div>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
                            {step === 1 ? (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                                            <MapPin className="w-5 h-5 text-blue-600" /> Add a Stand
                                        </h2>
                                        <p className="text-gray-500 mt-1 text-xs">Tap on the map to set the exact location, then fill in the details.</p>
                                    </div>

                                    <div className="bg-blue-50 text-blue-800 p-3.5 rounded-2xl text-xs border border-blue-100 flex items-start gap-3">
                                        <MapPin className="shrink-0 mt-0.5" size={16} />
                                        <p className="font-medium">{tempMarker ? `Location: ${tempMarker.lat.toFixed(4)}, ${tempMarker.lng.toFixed(4)}` : "Awaiting map click... tap the map first!"}</p>
                                    </div>

                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Stand Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Garia Auto Stand"
                                                className="w-full p-3 bg-white border border-gray-300 text-black text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                                                value={newStand.name}
                                                onChange={(e) => setNewStand({ ...newStand, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Type</label>
                                            <select
                                                className="w-full p-3 bg-white border border-gray-300 text-black text-sm rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                                                value={newStand.type}
                                                onChange={(e) => setNewStand({ ...newStand, type: e.target.value as any })}
                                            >
                                                <option value="auto_stand">Auto Stand</option>

                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Address (Optional)</label>
                                            <input
                                                type="text"
                                                placeholder="Street or Landmark"
                                                className="w-full p-3 bg-white border border-gray-300 text-black text-sm rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                                                value={newStand.address}
                                                onChange={(e) => setNewStand({ ...newStand, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={addStand}
                                        disabled={!tempMarker || !newStand.name}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                                    >
                                        <Save size={18} /> Save Location
                                    </button>

                                    <div className="pt-4 mt-2 border-t border-gray-200">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full bg-blue-50 text-blue-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                                        >
                                            Proceed to Create Route <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5 pb-8">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setStep(1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                            <ArrowLeft size={18} className="text-gray-700" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                                                <RouteIcon className="w-5 h-5 text-blue-600" /> Create Route
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 border border-gray-200 rounded-2xl space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1.5">From Stand</label>
                                                <SearchableSelect
                                                    options={stands}
                                                    value={selectedFrom}
                                                    onChange={setSelectedFrom}
                                                    placeholder="Search origin..."
                                                />
                                            </div>

                                            <div className="pl-4 border-l-2 border-dashed border-gray-300 py-2 space-y-4">
                                                {selectedStops.map((stopId, index) => (
                                                    <div key={index} className="flex gap-2 items-center">
                                                        <div className="flex-1">
                                                            <SearchableSelect
                                                                options={stands}
                                                                value={stopId}
                                                                onChange={(newId) => {
                                                                    const updated = [...selectedStops];
                                                                    updated[index] = newId;
                                                                    setSelectedStops(updated);
                                                                }}
                                                                placeholder={`Search stop ${index + 1}...`}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const updated = [...selectedStops];
                                                                updated.splice(index, 1);
                                                                setSelectedStops(updated);
                                                            }}
                                                            className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => setSelectedStops([...selectedStops, null])}
                                                    className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-800"
                                                >
                                                    <Plus size={14} /> Add Stop
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1.5">To Stand</label>
                                                <SearchableSelect
                                                    options={stands}
                                                    value={selectedTo}
                                                    onChange={setSelectedTo}
                                                    placeholder="Search destination..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Route Name (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-white border border-gray-300 text-black text-sm rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                                                value={routeName}
                                                onChange={(e) => setRouteName(e.target.value)}
                                                placeholder="e.g. Ballygunge to Park St"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Estimated Time (mins)</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 bg-white border border-gray-300 text-black text-sm rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                                                value={estimatedTime}
                                                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={createRoute}
                                        disabled={!selectedFrom || !selectedTo}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 mt-2"
                                    >
                                        <Save size={18} /> Submit Route
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}