"use client";

import PropertyCard from "./PropertyCard";
import type { Property } from "@/types";
import { Home, Building2 } from "lucide-react";

import type { ViewMode } from "./NavbarFilterBar";

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  hasFilters?: boolean;
  viewMode?: ViewMode;
}

export default function PropertyGrid({ properties, loading, hasFilters, viewMode = "grid" }: PropertyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border animate-pulse"
          >
            <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-px bg-border my-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
          {hasFilters ? (
            <Home className="w-10 h-10 text-muted-foreground" />
          ) : (
            <Building2 className="w-10 h-10 text-emerald-500/60" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {hasFilters ? "No Properties Found" : "No Properties Available Yet"}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {hasFilters
            ? "Try adjusting your filters or search criteria to find more properties."
            : "Stay tuned for upcoming listings. Our verified sellers are preparing exceptional properties for you."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          : "flex flex-col gap-6"
      }
    >
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          index={index}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}

