import type { Cafe } from "@/data/cafes";
import { cafes as sourceCafes } from "@/data/cafes";
import { readCache, writeCache } from "@/lib/offline-cache";

export type LatLng = { lat: number; lng: number };
export type TravelMode = "driving" | "walking";

export type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
  /** [lat, lng] pairs for drawing the route line. */
  geometry: [number, number][];
  estimated: boolean;
};

export const DEFAULT_CENTER: LatLng = { lat: 40.7308, lng: -73.9973 };

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Re-anchor the mock dataset around whatever centre we're browsing. */
export function localizeCafes(center: LatLng): Cafe[] {
  return sourceCafes.map((cafe) => ({
    ...cafe,
    lat: center.lat + cafe.offset.north / 111320,
    lng: center.lng + cafe.offset.east / (111320 * Math.cos((center.lat * Math.PI) / 180)),
  }));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

function estimateRoute(from: LatLng, to: LatLng, mode: TravelMode): RouteInfo {
  const straight = haversine(from, to);
  const distance = straight * (mode === "driving" ? 1.35 : 1.15);
  const speed = mode === "driving" ? 7.5 : 1.35; // m/s
  return {
    distanceMeters: distance,
    durationSeconds: distance / speed,
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    estimated: true,
  };
}

const ROUTE_CACHE = "brewnear:routes:v1";

function routeKey(from: LatLng, to: LatLng, mode: TravelMode) {
  const r = (n: number) => n.toFixed(4);
  return `${mode}:${r(from.lat)},${r(from.lng)}->${r(to.lat)},${r(to.lng)}`;
}

/**
 * Fetches a real route from the public OSRM service, falling back to a cached
 * result and then to a straight-line estimate so the app still works offline.
 */
export async function getRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
): Promise<RouteInfo> {
  const key = routeKey(from, to, mode);
  const cache = readCache<Record<string, RouteInfo>>(ROUTE_CACHE) ?? {};
  const profile = mode === "driving" ? "driving" : "foot";

  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = (await res.json()) as {
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = json.routes?.[0];
    if (!route) throw new Error("no route");
    const info: RouteInfo = {
      distanceMeters: route.distance,
      // The public demo server only routes cars, so derive walking time from distance.
      durationSeconds: mode === "walking" ? route.distance / 1.35 : route.duration,
      geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      estimated: false,
    };
    cache[key] = info;
    writeCache(ROUTE_CACHE, cache);
    return info;
  } catch {
    return cache[key] ?? estimateRoute(from, to, mode);
  }
}
