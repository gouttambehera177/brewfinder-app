import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";
import cafe4 from "@/assets/cafe-4.jpg";

/**
 * Mock dataset shaped like a Places API response so it can later be swapped
 * for Google Places / Foursquare results without touching the UI layer.
 *
 * `offset` is a metres-based delta from the active map centre so the demo
 * works from any real geolocation. Real data would simply set lat/lng.
 */

export type Ambience = "cozy" | "work-friendly" | "outdoor seating" | "romantic" | "lively";

export type Review = {
  author: string;
  rating: number;
  date: string;
  text: string;
};

export type Cafe = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  reviewCount: number;
  price: 1 | 2 | 3;
  cuisine: string;
  ambience: Ambience[];
  hours: Record<string, string>;
  photos: string[];
  reviews: Review[];
  /** Fallback absolute coordinates (demo city centre). */
  lat: number;
  lng: number;
  /** Metres north / east of the active centre. */
  offset: { north: number; east: number };
};

const DEMO_CENTER = { lat: 40.7308, lng: -73.9973 };

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function hours(weekday: string, weekend: string): Record<string, string> {
  return Object.fromEntries(WEEK.map((d) => [d, d === "Sat" || d === "Sun" ? weekend : weekday]));
}

function coords(north: number, east: number) {
  return {
    offset: { north, east },
    lat: DEMO_CENTER.lat + north / 111320,
    lng: DEMO_CENTER.lng + east / (111320 * Math.cos((DEMO_CENTER.lat * Math.PI) / 180)),
  };
}

export const cafes: Cafe[] = [
  {
    id: "ember-lane",
    name: "Ember Lane Roasters",
    tagline: "Single-origin espresso in a sun-washed corner room",
    address: "14 Ember Lane",
    phone: "+1 (212) 555-0142",
    email: "hello@emberlane.coffee",
    website: "emberlane.coffee",
    rating: 4.8,
    reviewCount: 412,
    price: 2,
    cuisine: "Specialty Coffee",
    ambience: ["cozy", "work-friendly"],
    hours: hours("7:00 AM – 7:00 PM", "8:00 AM – 6:00 PM"),
    photos: [cafe1, cafe2],
    reviews: [
      {
        author: "Maya R.",
        rating: 5,
        date: "2 weeks ago",
        text: "The Ethiopian pour-over is unreal and the window seats are perfect for a slow morning.",
      },
      {
        author: "Tomas K.",
        rating: 4,
        date: "1 month ago",
        text: "Great wifi, plenty of outlets. Gets busy after 10am on weekends.",
      },
    ],
    ...coords(70, 55),
  },
  {
    id: "clay-cup",
    name: "The Clay Cup",
    tagline: "Handmade ceramics, slow brews, quiet afternoons",
    address: "220 Marigold Street",
    phone: "+1 (212) 555-0177",
    email: "hi@claycup.cafe",
    website: "claycup.cafe",
    rating: 4.5,
    reviewCount: 236,
    price: 1,
    cuisine: "Bakery & Coffee",
    ambience: ["cozy", "romantic"],
    hours: hours("8:00 AM – 6:00 PM", "9:00 AM – 5:00 PM"),
    photos: [cafe3, cafe1],
    reviews: [
      {
        author: "Elena P.",
        rating: 5,
        date: "5 days ago",
        text: "Cardamom bun + flat white. Candlelit in the evening, genuinely lovely.",
      },
    ],
    ...coords(-120, 140),
  },
  {
    id: "north-terrace",
    name: "North Terrace Coffee",
    tagline: "String-lit courtyard with all-day brunch",
    address: "5 North Terrace",
    phone: "+1 (212) 555-0198",
    email: "bookings@northterrace.com",
    website: "northterrace.com",
    rating: 4.6,
    reviewCount: 589,
    price: 3,
    cuisine: "Mediterranean Brunch",
    ambience: ["outdoor seating", "lively", "romantic"],
    hours: hours("7:30 AM – 10:00 PM", "8:00 AM – 11:00 PM"),
    photos: [cafe3, cafe4],
    reviews: [
      {
        author: "Jon A.",
        rating: 5,
        date: "3 weeks ago",
        text: "The terrace at sunset is the best seat in the neighbourhood.",
      },
      {
        author: "Priya S.",
        rating: 4,
        date: "2 months ago",
        text: "Pricey but the shakshuka is worth it.",
      },
    ],
    ...coords(300, -180),
  },
  {
    id: "ledger-co",
    name: "Ledger & Co.",
    tagline: "Laptop-friendly library café with long communal tables",
    address: "88 Ledger Row",
    phone: "+1 (212) 555-0110",
    email: "team@ledgerandco.coffee",
    website: "ledgerandco.coffee",
    rating: 4.3,
    reviewCount: 174,
    price: 2,
    cuisine: "Specialty Coffee",
    ambience: ["work-friendly", "cozy"],
    hours: hours("7:00 AM – 9:00 PM", "9:00 AM – 7:00 PM"),
    photos: [cafe4, cafe2],
    reviews: [
      {
        author: "Sam W.",
        rating: 4,
        date: "1 week ago",
        text: "Deep-focus energy, quiet enough for calls in the back room.",
      },
    ],
    ...coords(-330, -260),
  },
  {
    id: "sable-milk",
    name: "Sable & Milk",
    tagline: "Brass, white tile and a very serious espresso program",
    address: "31 Sable Court",
    phone: "+1 (212) 555-0163",
    email: "contact@sableandmilk.co",
    website: "sableandmilk.co",
    rating: 4.9,
    reviewCount: 823,
    price: 3,
    cuisine: "Italian Espresso Bar",
    ambience: ["lively", "romantic"],
    hours: hours("6:30 AM – 5:00 PM", "7:30 AM – 4:00 PM"),
    photos: [cafe2, cafe1],
    reviews: [
      {
        author: "Dana L.",
        rating: 5,
        date: "4 days ago",
        text: "Best cortado I've had in the city. Standing room only, in the best way.",
      },
    ],
    ...coords(420, 480),
  },
  {
    id: "fern-house",
    name: "Fern House",
    tagline: "Plant-filled hideaway with matcha and slow mornings",
    address: "102 Fernway",
    phone: "+1 (212) 555-0125",
    email: "hello@fernhouse.cafe",
    website: "fernhouse.cafe",
    rating: 4.4,
    reviewCount: 310,
    price: 2,
    cuisine: "Japanese Tea & Coffee",
    ambience: ["cozy", "outdoor seating", "work-friendly"],
    hours: hours("8:00 AM – 8:00 PM", "8:00 AM – 8:00 PM"),
    photos: [cafe1, cafe3],
    reviews: [
      {
        author: "Kenji T.",
        rating: 5,
        date: "6 days ago",
        text: "Ceremonial matcha done right, and the courtyard is a secret gem.",
      },
    ],
    ...coords(-640, 380),
  },
  {
    id: "harbour-grind",
    name: "Harbour Grind",
    tagline: "Neighbourhood counter for fast, honest coffee",
    address: "7 Harbour Walk",
    phone: "+1 (212) 555-0184",
    email: "info@harbourgrind.com",
    website: "harbourgrind.com",
    rating: 4.1,
    reviewCount: 96,
    price: 1,
    cuisine: "Specialty Coffee",
    ambience: ["lively"],
    hours: hours("6:00 AM – 4:00 PM", "7:00 AM – 2:00 PM"),
    photos: [cafe2, cafe4],
    reviews: [
      {
        author: "Chris M.",
        rating: 4,
        date: "3 weeks ago",
        text: "In and out in two minutes with a proper flat white. Exactly what I need.",
      },
    ],
    ...coords(760, -520),
  },
  {
    id: "vesper-room",
    name: "The Vesper Room",
    tagline: "Candlelit evening café with dessert flights",
    address: "44 Vesper Street",
    phone: "+1 (212) 555-0151",
    email: "reserve@vesperroom.cafe",
    website: "vesperroom.cafe",
    rating: 4.7,
    reviewCount: 268,
    price: 3,
    cuisine: "French Patisserie",
    ambience: ["romantic", "cozy"],
    hours: hours("12:00 PM – 11:00 PM", "12:00 PM – 12:00 AM"),
    photos: [cafe1, cafe4],
    reviews: [
      {
        author: "Aline D.",
        rating: 5,
        date: "1 week ago",
        text: "Date-night perfect. The pistachio tart and a decaf cortado, every time.",
      },
    ],
    ...coords(-880, -140),
  },
];
