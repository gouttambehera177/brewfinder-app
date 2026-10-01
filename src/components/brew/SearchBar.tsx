import { useMemo, useState } from "react";
import { Search, LocateFixed, X } from "lucide-react";

import type { Cafe } from "@/lib/places.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  cafes: Cafe[];
  locating: boolean;
  onChange: (v: string) => void;
  onPick: (id: string) => void;
  onLocate: () => void;
};

export function SearchBar({ value, cafes, locating, onChange, onPick, onLocate }: Props) {
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return cafes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.cuisine.toLowerCase().includes(q) ||
          c.ambience.some((a) => a.includes(q)),
      )
      .slice(0, 5);
  }, [value, cafes]);

  return (
    <div className="relative flex-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder="Search cafes, cuisine or vibe…"
            aria-label="Search cafes"
            className="h-11 rounded-full border-border/80 bg-card pl-9 pr-9 shadow-sm"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={onLocate}
          disabled={locating}
          aria-label="Use my current location"
          className="h-11 w-11 shrink-0 rounded-full shadow-sm"
        >
          <LocateFixed className={locating ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-13 z-[1000] mt-2 overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-warm">
          {suggestions.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.cuisine}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
