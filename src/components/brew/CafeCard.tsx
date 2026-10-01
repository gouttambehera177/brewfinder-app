import { Star, MapPin, Clock } from "lucide-react";

import type { Cafe, RouteInfo } from "@/lib/places.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatDuration } from "@/lib/geo";
import { PlacePhoto } from "@/components/brew/PlacePhoto";

type Props = {
  cafe: Cafe;
  route?: RouteInfo | undefined;
  straightDistance: number;
  active: boolean;
  onSelect: () => void;
};

export function priceLabel(price: number) {
  return price ? "₹".repeat(price) : "₹ –";
}

export function CafeCard({ cafe, route, straightDistance, active, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group w-full overflow-hidden rounded-2xl border bg-card text-left transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-warm",
        active ? "border-primary shadow-warm ring-1 ring-primary/40" : "border-border/70",
      )}
    >
      <div className="flex gap-3 p-3">
        <PlacePhoto name={cafe.photoName} alt={cafe.name} className="h-24 w-24 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-base font-semibold text-foreground">{cafe.name}</h3>
            {cafe.rating > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {cafe.rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {cafe.cuisine} · {priceLabel(cafe.price)} · {cafe.reviewCount.toLocaleString("en-IN")} reviews
          </p>
          <p className="truncate text-xs text-muted-foreground">{cafe.address}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {cafe.openNow !== null && (
              <Badge variant={cafe.openNow ? "default" : "outline"} className="rounded-full text-[10px]">
                {cafe.openNow ? "Open now" : "Closed"}
              </Badge>
            )}
            {cafe.ambience.slice(0, 2).map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full text-[10px] capitalize">{a}</Badge>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {formatDistance(route?.distanceMeters ?? straightDistance)}
              {!route && " away"}
            </span>
            {route && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {formatDuration(route.durationSeconds)}
                {route.estimated && " approx."}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
