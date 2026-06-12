import { RouteData } from "@/types/route";

export async function getRoute(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
): Promise<RouteData | null> {
    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startLon},${startLat};${endLon},${endLat}` +
        `?overview=full&geometries=geojson`;

    const response = await fetch(url);

    const data = await response.json();

    if (!data.routes?.length) return null;

    const route = data.routes[0];

    return {
        distance: route.distance,
        duration: route.duration,

        geometry: route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({
                lat,
                lng,
            })
        ),
    };
}