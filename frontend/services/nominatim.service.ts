import { Station } from "@/types/station";

export async function searchLocation(
    query: string
): Promise<Station[]> {
    if (!query) return [];

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );

    const data = await response.json();

    return data.map((item: any) => ({
        id: item.place_id.toString(),
        name: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
    }));
}