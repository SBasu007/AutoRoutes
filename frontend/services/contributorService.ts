const BASE_URL = 'http://localhost:5000/api/contributor';

export type StandData = {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    type?: 'auto_stand' | 'destination' | 'stop';
};

export type RouteData = {
    fromStandId: number;
    toStandId: number;
    name?: string;
    path?: Array<{ lat: number; lng: number }>;
    stops?: number[];
    estimatedTimeMin?: number;
};

// Pass the auth token here if the backend requires authentication
export async function getStands() {
    const res = await fetch(`${BASE_URL}/stands`);
    if (!res.ok) throw new Error('Failed to fetch stands');
    return res.json();
}

export async function addStand(data: StandData, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/stands`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to add stand');
    }
    return res.json();
}

export async function getRoutes() {
    const res = await fetch(`${BASE_URL}/routes`);
    if (!res.ok) throw new Error('Failed to fetch routes');
    return res.json();
}

export async function addRoute(data: RouteData, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/routes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
         const errorData = await res.json().catch(() => null);
         throw new Error(errorData?.error || 'Failed to add route');
    }
    return res.json();
}
