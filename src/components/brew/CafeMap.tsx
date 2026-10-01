/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";

import type { Cafe, LatLng, RouteInfo } from "@/lib/places.types";

type Props = {
  center: LatLng;
  cafes: Cafe[];
  radius: number;
  selectedId: string | null;
  route: RouteInfo | null;
  onSelect: (id: string) => void;
};

declare global {
  interface Window {
    __brewMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__brewMapsReady = () => resolve();
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__brewMapsReady&channel=${channel}&region=IN&language=en-IN`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return loader;
}

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#b4562f";
}

export default function CafeMap({ center, cafes, radius, selectedId, route, onSelect }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const circle = useRef<google.maps.Circle | null>(null);
  const me = useRef<google.maps.Marker | null>(null);
  const line = useRef<google.maps.Polyline | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadGoogleMaps()
      .then(() => {
        if (!alive || !ref.current) return;
        mapRef.current = new google.maps.Map(ref.current, {
          center,
          zoom: 15,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          gestureHandling: "greedy",
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const primary = css("--primary");
    me.current?.setMap(null);
    me.current = new google.maps.Marker({
      map, position: center, title: "You are here", zIndex: 999,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#1a73e8", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 3 },
    });
    circle.current?.setMap(null);
    circle.current = new google.maps.Circle({
      map, center, radius, strokeColor: primary, strokeWeight: 1.5, strokeOpacity: 0.8, fillColor: primary, fillOpacity: 0.08, clickable: false,
    });
    const b = circle.current.getBounds();
    if (b) map.fitBounds(b, 40);
  }, [ready, center, radius]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    markers.current.forEach((m) => m.setMap(null));
    const primary = css("--primary");
    markers.current = cafes.map((c) => {
      const active = c.id === selectedId;
      const m = new google.maps.Marker({
        map,
        position: { lat: c.lat, lng: c.lng },
        title: c.name,
        zIndex: active ? 500 : 10,
        label: { text: c.rating ? c.rating.toFixed(1) : "☕", color: active ? "#ffffff" : primary, fontSize: "11px", fontWeight: "700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: active ? 17 : 14,
          fillColor: active ? primary : "#fffaf2",
          fillOpacity: 1,
          strokeColor: primary,
          strokeWeight: 2,
        },
      });
      m.addListener("click", () => selectRef.current(c.id));
      return m;
    });
  }, [ready, cafes, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    line.current?.setMap(null);
    line.current = null;
    if (!route || route.geometry.length < 2) return;
    const path = route.geometry.map(([lat, lng]) => ({ lat, lng }));
    line.current = new google.maps.Polyline({
      map, path, strokeColor: css("--foreground"), strokeWeight: 5, strokeOpacity: route.estimated ? 0 : 0.85,
      ...(route.estimated ? { icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "14px" }] } : {}),
    });
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);
  }, [ready, route]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
          Map couldn't load ({error}). Cafes are still listed.
        </div>
      )}
    </div>
  );
}
