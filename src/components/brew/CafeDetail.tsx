import { Star, Phone, MapPin, Globe, Navigation, X, Clock, Share2, Heart } from "lucide-react";
import { toast } from "sonner";

import type { Cafe, RouteInfo, TravelMode } from "@/lib/places.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistance, formatDuration } from "@/lib/geo";
import { priceLabel } from "@/components/brew/CafeCard";
import { PlacePhoto } from "@/components/brew/PlacePhoto";

type Props = {
  cafe: Cafe;
  route: RouteInfo | null;
  mode: TravelMode;
  onClose: () => void;
  saved: boolean;
  onToggleSave: () => void;
};

/** Open Google pages in a real new tab; Google refuses to load inside the app frame. */
function openExternal(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.assign(url);
}

export function CafeDetail({ cafe, route, mode, onClose, saved, onToggleSave }: Props) {
  const share = async () => {
    const url = cafe.mapsUri ?? `https://www.google.com/maps/search/?api=1&query=${cafe.lat},${cafe.lng}`;
    const text = `${cafe.name} — ${cafe.address}`;
    try {
      if (navigator.share) await navigator.share({ title: cafe.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success("Link copied — share it on WhatsApp!");
      }
    } catch { /* user cancelled */ }
  };
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}&destination_place_id=${cafe.id}&travelmode=${mode === "driving" ? "driving" : "walking"}`;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="relative">
        <PlacePhoto name={cafe.photoName} alt={cafe.name} className="h-44 w-full" />
        {cafe.photoAttribution && (
          <span className="absolute bottom-1 left-2 rounded bg-background/80 px-1.5 text-[10px] text-muted-foreground">
            Photo: {cafe.photoAttribution.uri ? (
              <a href={cafe.photoAttribution.uri} target="_blank" rel="noreferrer" className="underline">{cafe.photoAttribution.name}</a>
            ) : cafe.photoAttribution.name}
          </span>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <Button size="icon" variant="secondary" onClick={onToggleSave} aria-label={saved ? "Remove from saved" : "Save cafe"} className="rounded-full shadow-warm">
            <Heart className={saved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
          </Button>
          <Button size="icon" variant="secondary" onClick={share} aria-label="Share cafe" className="rounded-full shadow-warm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={onClose} aria-label="Close details" className="rounded-full shadow-warm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">{cafe.name}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {cafe.rating > 0 && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="h-4 w-4 fill-accent text-accent" /> {cafe.rating.toFixed(1)}
              </span>
            )}
            <span>({cafe.reviewCount.toLocaleString("en-IN")} Google reviews)</span>
            <span>· {priceLabel(cafe.price)}</span>
            <span>· {cafe.cuisine}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {cafe.openNow !== null && (
              <Badge variant={cafe.openNow ? "default" : "outline"} className="rounded-full">{cafe.openNow ? "Open now" : "Closed now"}</Badge>
            )}
            {cafe.ambience.map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full capitalize">{a}</Badge>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/60 p-3 text-sm">
          {route ? (
            <p className="text-foreground">
              <span className="font-semibold">{formatDistance(route.distanceMeters)}</span> ·{" "}
              <span className="font-semibold">{formatDuration(route.durationSeconds)}</span>{" "}
              {mode === "driving" ? "by road" : "walking"} — route shown on the map
              {route.estimated ? " (approx., offline)" : " · via Google"}
            </p>
          ) : (
            <p className="text-muted-foreground">Calculating route…</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button className="rounded-full" onClick={() => openExternal(directions)}>
            <Navigation className="mr-1.5 h-4 w-4" /> Navigate
          </Button>
          {cafe.phone ? (
            <Button asChild variant="outline" className="rounded-full">
              <a href={`tel:${cafe.phone.replace(/\s/g, "")}`}><Phone className="mr-1.5 h-4 w-4" /> Call</a>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full" disabled>No phone</Button>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <p className="flex gap-2 text-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {cafe.address}</p>
          {cafe.phone && <p className="flex gap-2 text-foreground"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {cafe.phone}</p>}
          {cafe.website && (
            <a href={cafe.website} target="_blank" rel="noreferrer" className="flex gap-2 truncate text-primary underline-offset-2 hover:underline">
              <Globe className="mt-0.5 h-4 w-4 shrink-0" /> {cafe.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {cafe.mapsUri && (
            <button type="button" onClick={() => openExternal(cafe.mapsUri!)} className="flex gap-2 text-left text-primary underline-offset-2 hover:underline">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> View on Google Maps
            </button>
          )}
        </div>

        {cafe.hours.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Clock className="h-4 w-4 text-primary" /> Opening hours</h3>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {cafe.hours.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </div>
          </>
        )}

        {cafe.reviews.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Recent Google reviews</h3>
              {cafe.reviews.map((r, i) => (
                <div key={i} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between text-xs">
                    {r.authorUri ? (
                      <a href={r.authorUri} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline">{r.author}</a>
                    ) : <span className="font-medium text-foreground">{r.author}</span>}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent text-accent" /> {r.rating} · {r.when}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-4 text-xs text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-[10px] text-muted-foreground">Data © Google</p>
      </div>
    </div>
  );
}
