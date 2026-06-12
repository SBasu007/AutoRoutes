export interface RoutePoint {
    lat: number;
    lng: number;
}

export interface RouteData {
    distance: number;
    duration: number;
    geometry: RoutePoint[];
}