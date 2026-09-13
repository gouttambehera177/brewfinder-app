import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Cafe } from "@/data/cafes";
import type { LatLng, RouteInfo } from "@/lib/geo";

type Props = {
  center: LatLng;
  cafes: Cafe[];
  radius: number;
  selectedId: string | null;
  route: RouteInfo | null;
  onSelect: (id: string) => void;
};

function pinIcon(cafe: Cafe, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="brew-pin${active ? " brew-pin-active" : ""}">${cafe.rating.toFixed(1)}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 34],
  });
}

export default function CafeMap({ center, cafes, radius, selectedId, route, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const circleRef = useRef<L.Circle | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const meRef = useRef<L.CircleMarker | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
      crossOrigin: true,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      circleRef.current = null;
      routeRef.current = null;
      meRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centre marker + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });

    meRef.current?.remove();
    meRef.current = L.circleMarker([center.lat, center.lng], {
      radius: 7,
      color: "#ffffff",
      weight: 3,
      fillColor: "#b4562f",
      fillOpacity: 1,
    }).addTo(map);

    circleRef.current?.remove();
    circleRef.current = L.circle([center.lat, center.lng], {
      radius,
      color: "#b4562f",
      weight: 1.5,
      dashArray: "5 6",
      fillColor: "#d98b5f",
      fillOpacity: 0.09,
    }).addTo(map);

    map.fitBounds(circleRef.current.getBounds(), { padding: [40, 40], maxZoom: 17 });
  }, [center.lat, center.lng, radius]);

  // Cafe pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    cafes.forEach((cafe) => {
      const marker = L.marker([cafe.lat, cafe.lng], {
        icon: pinIcon(cafe, cafe.id === selectedId),
        title: cafe.name,
      })
        .addTo(map)
        .on("click", () => selectRef.current(cafe.id));
      markersRef.current[cafe.id] = marker;
    });
  }, [cafes, selectedId]);

  // Route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    routeRef.current?.remove();
    routeRef.current = null;
    if (!route) return;
    routeRef.current = L.polyline(route.geometry, {
      color: "#7a4a2b",
      weight: 5,
      opacity: 0.85,
      dashArray: route.estimated ? "8 8" : undefined,
      lineCap: "round",
    }).addTo(map);
    map.fitBounds(routeRef.current.getBounds(), { padding: [50, 50], maxZoom: 17 });
  }, [route]);

  return <div ref={containerRef} className="h-full w-full" />;
}
