import { Star, Phone, Mail, MapPin, Globe, Navigation, X } from "lucide-react";

import type { Cafe } from "@/data/cafes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistance, formatDuration, type RouteInfo, type TravelMode } from "@/lib/geo";
import { priceLabel } from "@/components/brew/CafeCard";

type Props = {
  cafe: Cafe;
  route: RouteInfo | null;
  mode: TravelMode;
  onClose: () => void;
};

export function CafeDetail({ cafe, route, mode, onClose }: Props) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}&travelmode=${mode === "driving" ? "driving" : "walking"}`;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="relative">
        <img
          src={cafe.photos[0]}
          alt={`${cafe.name} interior`}
          width={1024}
          height={768}
          className="h-44 w-full object-cover"
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 rounded-full shadow-warm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">{cafe.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{cafe.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-medium">
                <Star className="h-4 w-4 fill-accent text-accent" />
                {cafe.rating.toFixed(1)}
                <span className="text-muted-foreground">({cafe.reviewCount})</span>
              </span>
              <span className="text-muted-foreground">{priceLabel(cafe.price)}</span>
              <span className="text-muted-foreground">{cafe.cuisine}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {cafe.ambience.map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full capitalize">
                {a}
              </Badge>
            ))}
          </div>

          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {mode === "driving" ? "By road" : "Walking"}
            </p>
            <p className="mt-1 font-display text-lg text-foreground">
              {route
                ? `${formatDuration(route.durationSeconds)} · ${formatDistance(route.distanceMeters)}`
                : "Calculating route…"}
            </p>
            {route?.estimated && (
              <p className="mt-1 text-xs text-muted-foreground">
                Offline estimate — reconnect for live routing.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {cafe.photos.map((p, i) => (
              <img
                key={i}
                src={p}
                alt={`${cafe.name} photo ${i + 1}`}
                loading="lazy"
                width={1024}
                height={768}
                className="h-28 w-full rounded-xl object-cover"
              />
            ))}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {cafe.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href={`tel:${cafe.phone}`} className="hover:underline">
                {cafe.phone}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${cafe.email}`} className="hover:underline">
                {cafe.email}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {cafe.website}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Opening hours
            </h3>
            <dl className="mt-2 space-y-1 text-sm">
              {Object.entries(cafe.hours).map(([day, value]) => (
                <div key={day} className="flex justify-between">
                  <dt className="text-muted-foreground">{day}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Separator />

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Reviews
            </h3>
            <ul className="mt-3 space-y-3">
              {cafe.reviews.map((r, i) => (
                <li key={i} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.author}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{r.date}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 p-4">
        <Button asChild className="w-full rounded-xl" size="lg">
          <a href={directions} target="_blank" rel="noreferrer">
            <Navigation className="mr-2 h-4 w-4" />
            Get directions
          </a>
        </Button>
      </div>
    </div>
  );
}
