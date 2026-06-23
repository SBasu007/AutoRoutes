const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/planner`;

export type GeoPoint = { lat: number; lng: number };

export type TripLeg =
  | { type: 'walk', instruction: string, distanceKm: number, from: GeoPoint, to: GeoPoint }
  | { type: 'auto', instruction: string, routeId: number, fromStand: any, toStand: any };

export type TripPlan = {
    type: 'trip' | 'walk_only';
    message: string;
    totalDistanceKm: number;
    legs: TripLeg[];
    origin?: GeoPoint;
    destination?: GeoPoint;
    error?: string;
};

export async function planTrip(lat: number, lng: number, destLat: number, destLng: number): Promise<TripPlan> {
    const res = await fetch(`${BASE_URL}/plan-trip?lat=${lat}&lng=${lng}&destLat=${destLat}&destLng=${destLng}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to plan trip');
    }
    return res.json();
}
