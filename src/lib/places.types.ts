export type Ambience = "outdoor seating" | "good for groups" | "vegetarian" | "dine-in" | "takeout";

export type PlaceReview = {
  author: string;
  authorUri?: string | undefined;
  photo?: string | undefined;
  rating: number;
  text: string;
  when: string;
};

export type Cafe = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  /** 0 = unknown, 1–4 = ₹ to ₹₹₹₹ */
  price: number;
  cuisine: string;
  ambience: Ambience[];
  openNow: boolean | null;
  hours: string[];
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  photoName: string | null;
  photoAttribution: { name: string; uri?: string | undefined } | null;
  reviews: PlaceReview[];
};

export type LatLng = { lat: number; lng: number };
export type TravelMode = "driving" | "walking";

export type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  estimated: boolean;
};
