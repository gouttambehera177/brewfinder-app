import type { LatLng, RouteInfo, TravelMode } from "@/lib/places.types";
import { readCache, writeCache } from "@/lib/offline-cache";
import { computeRoute } from "@/lib/places.functions";

export type { LatLng, RouteInfo, TravelMode };

/** Connaught Place, New Delhi — used until the browser shares a location. */
export const DEFAULT_CENTER: LatLng = { lat: 28.6315, lng: 77.2167 };

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

function estimateRoute(from: LatLng, to: LatLng, mode: TravelMode): RouteInfo {
  const distance = haversine(from, to) * (mode === "driving" ? 1.35 : 1.15);
  const speed = mode === "driving" ? 5.5 : 1.3;
  return {
    distanceMeters: distance,
    durationSeconds: distance / speed,
    geometry: [[from.lat, from.lng], [to.lat, to.lng]],
    estimated: true,
  };
}

const ROUTE_CACHE = "brewnear:groutes:v1";
const key = (f: LatLng, t: LatLng, m: TravelMode) =>
  `${m}:${f.lat.toFixed(4)},${f.lng.toFixed(4)}->${t.lat.toFixed(4)},${t.lng.toFixed(4)}`;

/** Real Google route; falls back to a saved route, then a straight-line estimate offline. */
export async function getRoute(from: LatLng, to: LatLng, mode: TravelMode): Promise<RouteInfo> {
  const k = key(from, to, mode);
  const cache = readCache<Record<string, RouteInfo>>(ROUTE_CACHE) ?? {};
  try {
    const info = await computeRoute({ data: { from, to: { lat: to.lat, lng: to.lng }, mode } });
    cache[k] = info;
    writeCache(ROUTE_CACHE, cache);
    return info;
  } catch {
    return cache[k] ?? estimateRoute(from, to, mode);
  }
}
