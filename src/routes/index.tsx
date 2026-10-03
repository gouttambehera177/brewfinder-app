import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { WifiOff, Coffee } from "lucide-react";

import { BrewLogo } from "@/components/brew/BrewLogo";
import { CafeCard } from "@/components/brew/CafeCard";
import { CafeDetail } from "@/components/brew/CafeDetail";
import { FilterBar, type Filters } from "@/components/brew/FilterBar";
import { SearchBar } from "@/components/brew/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_CENTER, getRoute, haversine, type LatLng, type RouteInfo } from "@/lib/geo";
import { searchNearbyCafes } from "@/lib/places.functions";
import type { Cafe } from "@/lib/places.types";
import { readCache, writeCache } from "@/lib/offline-cache";
import { registerServiceWorker } from "@/lib/pwa";

const CafeMap = lazy(() => import("@/components/brew/CafeMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BrewNear — Find cafes & chai spots near you" },
      { name: "description", content: "Discover nearby cafes on a map, filter by distance, price and vibe, and get walking or driving routes — even offline." },
      { property: "og:title", content: "BrewNear — Find cafes & chai spots near you" },
      { property: "og:description", content: "Discover nearby cafes, filter by radius and vibe, and get routes — even offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CENTER_CACHE = "brewnear:center:v1";

function Index() {
  const [mounted, setMounted] = useState(false);
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [locating, setLocating] = useState(false);
  const [online, setOnline] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  useEffect(() => { setSaved(readCache<string[]>("brewnear:saved:v1") ?? []); }, []);
  const toggleSave = (id: string) =>
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeCache("brewnear:saved:v1", next);
      return next;
    });
  const [routes, setRoutes] = useState<Record<string, RouteInfo>>({});
  const [filters, setFilters] = useState<Filters>({
    radius: 500, mode: "walking", prices: [], ambience: [], cuisine: "all", minRating: 0, sort: "distance", openNow: false, savedOnly: false,
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCenter(c);
        writeCache(CENTER_CACHE, c);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    const cached = readCache<LatLng>(CENTER_CACHE);
    if (cached) setCenter(cached);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    locate();
    registerServiceWorker();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [locate]);

  const cacheKey = `brewnear:cafes:${center.lat.toFixed(3)},${center.lng.toFixed(3)},${filters.radius}`;
  const { data: fetched, isFetching, error } = useQuery({
    queryKey: ["cafes", center.lat.toFixed(4), center.lng.toFixed(4), filters.radius],
    queryFn: async () => {
      try {
        const res = await searchNearbyCafes({ data: { lat: center.lat, lng: center.lng, radius: filters.radius } });
        writeCache(cacheKey, res);
        return res;
      } catch (e) {
        const saved = readCache<Cafe[]>(cacheKey);
        if (saved) return saved;
        throw e;
      }
    },
    enabled: mounted,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const all: Cafe[] = useMemo(() => fetched ?? [], [fetched]);
  const cuisines = useMemo(() => [...new Set(all.map((c) => c.cuisine))].sort(), [all]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all
      .map((c) => ({ cafe: c, d: haversine(center, c) }))
      .filter(({ cafe, d }) =>
        d <= filters.radius &&
        (filters.prices.length === 0 || filters.prices.includes(cafe.price)) &&
        filters.ambience.every((a) => cafe.ambience.includes(a)) &&
        (filters.cuisine === "all" || cafe.cuisine === filters.cuisine) &&
        cafe.rating >= filters.minRating &&
        (!filters.openNow || cafe.openNow === true) &&
        (!filters.savedOnly || saved.includes(cafe.id)) &&
        (!q || cafe.name.toLowerCase().includes(q) || cafe.cuisine.toLowerCase().includes(q) || cafe.ambience.some((a) => a.includes(q))),
      );
    const s = filters.sort;
    list.sort((a, b) =>
      s === "rating" ? b.cafe.rating - a.cafe.rating :
      s === "reviews" ? b.cafe.reviewCount - a.cafe.reviewCount :
      s === "price" ? a.cafe.price - b.cafe.price : a.d - b.d,
    );
    return list;
  }, [all, center, filters, query, saved]);

  const selected = all.find((c) => c.id === selectedId) ?? null;
  const routeKey = (id: string) => `${filters.mode}:${id}:${center.lat.toFixed(4)},${center.lng.toFixed(4)}`;
  const selectedRoute = selected ? routes[routeKey(selected.id)] ?? null : null;

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    if (!selected) return;
    const k = routeKey(selected.id);
    if (routes[k]) return;
    getRoute(center, selected, filters.mode).then((r) => {
      if (!cancelled) setRoutes((prev) => ({ ...prev, [k]: r }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, selected?.id, filters.mode, center]);

  const list = (
    <div className="space-y-3">
      {isFetching && all.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Finding real cafes near you…</p>
      ) : error && all.length === 0 ? (
        <p className="p-6 text-center text-sm text-destructive">Couldn't load cafes from Google right now. Please try again.</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Coffee className="mx-auto mb-2 h-6 w-6 text-primary" />
          No cafes match. Try a wider radius or fewer filters.
        </div>
      ) : (
        visible.map(({ cafe, d }, i) => (
          <div key={cafe.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}>
            <CafeCard cafe={cafe} route={routes[routeKey(cafe.id)]} straightDistance={d} active={cafe.id === selectedId} onSelect={() => setSelectedId(cafe.id)} saved={saved.includes(cafe.id)} onToggleSave={() => toggleSave(cafe.id)} />
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="z-[1001] border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BrewLogo />
              <span className="hidden font-display text-xl font-semibold text-foreground sm:inline">BrewNear</span>
            </div>
            <SearchBar value={query} cafes={all} locating={locating} onChange={setQuery} onPick={setSelectedId} onLocate={locate} />
          </div>
          <FilterBar filters={filters} cuisines={cuisines} onChange={(n) => setFilters((f) => ({ ...f, ...n }))} />
        </div>
      </header>

      {!online && (
        <div className="flex items-center justify-center gap-2 bg-secondary px-4 py-1.5 text-xs text-secondary-foreground">
          <WifiOff className="h-3.5 w-3.5" /> You're offline — showing saved cafes and routes.
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="order-2 hidden w-[400px] shrink-0 overflow-y-auto border-r border-border/60 p-4 md:order-1 md:block">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {visible.length} cafes within {filters.radius < 1000 ? `${filters.radius} m` : "1 km"}
          </p>
          {list}
        </aside>

        <section className="relative min-h-0 flex-1 md:order-2">
          {mounted && (
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
              <CafeMap center={center} cafes={visible.map((v) => v.cafe)} radius={filters.radius} selectedId={selectedId} route={selectedRoute} onSelect={setSelectedId} />
            </Suspense>
          )}

          {selected && (
            <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[75%] overflow-hidden rounded-t-3xl shadow-warm animate-in slide-in-from-bottom-4 md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-[380px] md:max-h-none md:rounded-3xl">
              <CafeDetail cafe={selected} route={selectedRoute} mode={filters.mode} onClose={() => setSelectedId(null)} saved={saved.includes(selected.id)} onToggleSave={() => toggleSave(selected.id)} />
            </div>
          )}

          {/* Mobile bottom sheet list */}
          {!selected && (
            <div className={`absolute inset-x-0 bottom-0 z-[999] overflow-y-auto rounded-t-3xl transition-[max-height] duration-300 ease-out ${sheetOpen ? "max-h-[85%]" : "max-h-[42%]"} border-t border-border/60 bg-background/95 p-4 pt-2 shadow-warm backdrop-blur md:hidden`}>
              <button type="button" onClick={() => setSheetOpen((o) => !o)} aria-label={sheetOpen ? "Show more map" : "Show more cafes"} className="sticky -top-2 z-10 -mx-4 mb-2 flex w-[calc(100%+2rem)] justify-center bg-background/95 py-2">
                <span className="h-1.5 w-10 rounded-full bg-border" />
              </button>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {visible.length} cafes nearby
              </p>
              {list}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
