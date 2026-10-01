import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Ambience, Cafe, RouteInfo } from "./places.types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function creds() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const maps = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovable || !maps) throw new Error("Google Maps connection is not configured");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": maps };
}

async function check(res: Response) {
  if (res.ok) return;
  const body = await res.text();
  console.error(`Google Maps request failed [${res.status}]: ${body}`);
  if (res.status === 403) throw new Error("Google Maps denied the request (403). Check the API key restrictions.");
  throw new Error(`Google Maps request failed [${res.status}]`);
}

// Short-lived in-memory caches keep repeated lookups from re-billing.
const searchCache = new Map<string, { at: number; data: Cafe[] }>();
const photoCache = new Map<string, string>();
const routeCache = new Map<string, RouteInfo>();

const PRICE: Record<string, number> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

type GPlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  outdoorSeating?: boolean;
  goodForGroups?: boolean;
  servesVegetarianFood?: boolean;
  dineIn?: boolean;
  takeout?: boolean;
  photos?: { name: string; authorAttributions?: { displayName: string; uri?: string }[] }[];
  reviews?: {
    rating?: number;
    text?: { text: string };
    originalText?: { text: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName: string; uri?: string; photoUri?: string };
  }[];
};

const FIELDS = [
  "id", "displayName", "formattedAddress", "shortFormattedAddress", "location", "rating",
  "userRatingCount", "priceLevel", "primaryTypeDisplayName", "currentOpeningHours",
  "regularOpeningHours", "nationalPhoneNumber", "internationalPhoneNumber", "websiteUri",
  "googleMapsUri", "outdoorSeating", "goodForGroups", "servesVegetarianFood", "dineIn",
  "takeout", "photos", "reviews",
].map((f) => `places.${f}`).join(",");

function toCafe(p: GPlace): Cafe {
  const ambience: Ambience[] = [];
  if (p.outdoorSeating) ambience.push("outdoor seating");
  if (p.goodForGroups) ambience.push("good for groups");
  if (p.servesVegetarianFood) ambience.push("vegetarian");
  if (p.dineIn) ambience.push("dine-in");
  if (p.takeout) ambience.push("takeout");
  const photo = p.photos?.[0];
  const author = photo?.authorAttributions?.[0];
  return {
    id: p.id,
    name: p.displayName?.text ?? "Unnamed cafe",
    address: p.shortFormattedAddress ?? p.formattedAddress ?? "",
    lat: p.location.latitude,
    lng: p.location.longitude,
    rating: p.rating ?? 0,
    reviewCount: p.userRatingCount ?? 0,
    price: p.priceLevel ? (PRICE[p.priceLevel] ?? 0) : 0,
    cuisine: p.primaryTypeDisplayName?.text ?? "Cafe",
    ambience,
    openNow: p.currentOpeningHours?.openNow ?? null,
    hours: p.regularOpeningHours?.weekdayDescriptions ?? p.currentOpeningHours?.weekdayDescriptions ?? [],
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    mapsUri: p.googleMapsUri ?? null,
    photoName: photo?.name ?? null,
    photoAttribution: author ? { name: author.displayName, uri: author.uri } : null,
    reviews: (p.reviews ?? []).slice(0, 5).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Google user",
      authorUri: r.authorAttribution?.uri,
      photo: r.authorAttribution?.photoUri,
      rating: r.rating ?? 0,
      text: r.text?.text ?? r.originalText?.text ?? "",
      when: r.relativePublishTimeDescription ?? "",
    })),
  };
}

export const searchNearbyCafes = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().min(50).max(2000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = `${data.lat.toFixed(3)},${data.lng.toFixed(3)},${data.radius}`;
    const hit = searchCache.get(key);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;

    const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchNearby`, {
      method: "POST",
      headers: { ...creds(), "Content-Type": "application/json", "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify({
        includedTypes: ["cafe", "coffee_shop", "tea_house"],
        maxResultCount: 20,
        rankPreference: "DISTANCE",
        languageCode: "en-IN",
        regionCode: "IN",
        locationRestriction: {
          circle: { center: { latitude: data.lat, longitude: data.lng }, radius: data.radius },
        },
      }),
    });
    await check(res);
    const json = (await res.json()) as { places?: GPlace[] };
    const cafes = (json.places ?? []).map(toCafe);
    searchCache.set(key, { at: Date.now(), data: cafes });
    return cafes;
  });

export const getPlacePhoto = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ name: z.string().regex(/^places\/[\w-]+\/photos\/[\w-]+$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const cached = photoCache.get(data.name);
    if (cached) return { uri: cached };
    const res = await fetch(
      `${GATEWAY_URL}/places/v1/${data.name}/media?maxWidthPx=800&skipHttpRedirect=true`,
      { headers: creds() },
    );
    await check(res);
    const json = (await res.json()) as { photoUri?: string };
    if (!json.photoUri) return { uri: null };
    photoCache.set(data.name, json.photoUri);
    return { uri: json.photoUri };
  });

function decodePolyline(str: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do {
        b = str.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta; else lng += delta;
    }
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}

const point = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ from: point, to: point, mode: z.enum(["driving", "walking"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<RouteInfo> => {
    const r = (n: number) => n.toFixed(4);
    const key = `${data.mode}:${r(data.from.lat)},${r(data.from.lng)}->${r(data.to.lat)},${r(data.to.lng)}`;
    const cached = routeCache.get(key);
    if (cached) return cached;
    const ll = (p: { lat: number; lng: number }) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
    const res = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        ...creds(),
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: ll(data.from),
        destination: ll(data.to),
        travelMode: data.mode === "driving" ? "DRIVE" : "WALK",
        ...(data.mode === "driving" ? { routingPreference: "TRAFFIC_AWARE" } : {}),
        languageCode: "en-IN",
        units: "METRIC",
      }),
    });
    await check(res);
    const json = (await res.json()) as {
      routes?: { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[];
    };
    const route = json.routes?.[0];
    if (!route) throw new Error("No route found");
    const info: RouteInfo = {
      distanceMeters: route.distanceMeters ?? 0,
      durationSeconds: parseInt(route.duration ?? "0", 10),
      geometry: route.polyline?.encodedPolyline ? decodePolyline(route.polyline.encodedPolyline) : [],
      estimated: false,
    };
    routeCache.set(key, info);
    return info;
  });
