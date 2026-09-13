import { Car, Footprints, SlidersHorizontal } from "lucide-react";

import type { Ambience } from "@/data/cafes";
import type { TravelMode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const RADII = [100, 200, 500, 1000] as const;
export const AMBIENCES: Ambience[] = ["cozy", "work-friendly", "outdoor seating", "romantic", "lively"];

export type SortKey = "distance" | "rating" | "reviews" | "price";

export type Filters = {
  radius: number;
  mode: TravelMode;
  prices: number[];
  ambience: Ambience[];
  cuisine: string;
  minRating: number;
  sort: SortKey;
};

type Props = {
  filters: Filters;
  cuisines: string[];
  onChange: (next: Partial<Filters>) => void;
};

function Pill({
  active,
  children,
  onClick,
  label,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-warm"
          : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({ filters, cuisines, onChange }: Props) {
  const toggleIn = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const activeCount =
    filters.prices.length + filters.ambience.length + (filters.cuisine === "all" ? 0 : 1) + (filters.minRating > 0 ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-secondary/70 p-1">
        {RADII.map((r) => (
          <Pill key={r} active={filters.radius === r} onClick={() => onChange({ radius: r })}>
            {r < 1000 ? `${r} m` : "1 km"}
          </Pill>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-secondary/70 p-1">
        <Pill active={filters.mode === "driving"} onClick={() => onChange({ mode: "driving" })}>
          <span className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" /> By road
          </span>
        </Pill>
        <Pill active={filters.mode === "walking"} onClick={() => onChange({ mode: "walking" })}>
          <span className="flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5" /> Walking
          </span>
        </Pill>
      </div>

      <Select value={filters.sort} onValueChange={(v) => onChange({ sort: v as SortKey })}>
        <SelectTrigger className="h-9 w-[150px] rounded-full bg-card text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="distance">Sort: Nearest</SelectItem>
          <SelectItem value="rating">Sort: Top rated</SelectItem>
          <SelectItem value="reviews">Sort: Most reviewed</SelectItem>
          <SelectItem value="price">Sort: Cheapest</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 rounded-full bg-card text-xs">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <Badge className="ml-2 rounded-full px-1.5 py-0 text-[10px]">{activeCount}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4 rounded-2xl">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Price</Label>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((p) => (
                <Pill
                  key={p}
                  active={filters.prices.includes(p)}
                  onClick={() => onChange({ prices: toggleIn(filters.prices, p) })}
                >
                  {"$".repeat(p)}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ambience</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMBIENCES.map((a) => (
                <Pill
                  key={a}
                  active={filters.ambience.includes(a)}
                  onClick={() => onChange({ ambience: toggleIn(filters.ambience, a) })}
                >
                  <span className="capitalize">{a}</span>
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Culture / cuisine</Label>
            <Select value={filters.cuisine} onValueChange={(v) => onChange({ cuisine: v })}>
              <SelectTrigger className="mt-2 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cultures</SelectItem>
                {cuisines.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Minimum rating: {filters.minRating.toFixed(1)}
            </Label>
            <Slider
              className="mt-3"
              value={[filters.minRating]}
              min={0}
              max={5}
              step={0.1}
              onValueChange={([v]) => onChange({ minRating: v })}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
