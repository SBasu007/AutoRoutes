import { Station } from "@/types/station";
import { ThrottleQueue } from "@/lib/rateLimiter";

// OpenStreetMap Nominatim usage policy limits queries to 1 request per second
const nominatimThrottle = new ThrottleQueue(1000);

export async function searchLocation(
    query: string
): Promise<Station[]> {
    if (!query) return [];

    return nominatimThrottle.execute(async () => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        return data.map((item: any) => ({
            id: item.place_id.toString(),
            name: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
        }));
    });
}