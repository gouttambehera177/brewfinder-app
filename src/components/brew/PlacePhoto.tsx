import { useQuery } from "@tanstack/react-query";
import { Coffee } from "lucide-react";

import { getPlacePhoto } from "@/lib/places.functions";
import { cn } from "@/lib/utils";

export function PlacePhoto({ name, alt, className }: { name: string | null; alt: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ["photo", name],
    queryFn: () => getPlacePhoto({ data: { name: name! } }),
    enabled: !!name,
    staleTime: Infinity,
    retry: false,
  });
  if (!data?.uri) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary text-primary", className)}>
        <Coffee className="h-6 w-6" />
      </div>
    );
  }
  return <img src={data.uri} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
