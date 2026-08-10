"use client";

import { motion, AnimatePresence } from "framer-motion";
import PropertyCard from "./PropertyCard";
import type { Property } from "@/types";
import type { ViewMode } from "./NavbarFilterBar";
import { Home, Building2, SearchX } from "lucide-react";

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  hasFilters?: boolean;
  viewMode?: ViewMode;
}

export default function PropertyGrid({
  properties,
  loading,
  hasFilters,
  viewMode = "grid",
}: PropertyGridProps) {
  if (loading) {
    if (viewMode === "list") {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border animate-pulse p-4 flex flex-col sm:flex-row gap-4"
            >
              <div className="sm:w-72 h-44 bg-muted rounded-xl shrink-0" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded w-full" />
                <div className="h-px bg-border my-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border animate-pulse overflow-hidden"
          >
            <div className="aspect-[16/10] bg-muted" />
            <div className="p-3.5 space-y-2.5">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3.5 bg-muted rounded w-1/2" />
              <div className="h-px bg-border my-1.5" />
              <div className="h-3.5 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center bg-card/40 rounded-3xl border border-dashed border-border/80 p-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          {hasFilters ? (
            <SearchX className="w-8 h-8 text-emerald-500" />
          ) : (
            <Building2 className="w-8 h-8 text-emerald-500" />
          )}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-1.5">
          {hasFilters ? "No Matching Properties Found" : "No Properties Available Yet"}
        </h3>
        <p className="text-muted-foreground max-w-md text-xs sm:text-sm leading-relaxed">
          {hasFilters
            ? "We couldn't find any properties matching your current filter criteria. Try adjusting your location, price range, or bedrooms filter."
            : "Stay tuned for upcoming listings. Our verified sellers are preparing exceptional properties for you."}
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        className={
          viewMode === "list"
            ? "space-y-3.5"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
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
      </motion.div>
    </AnimatePresence>
  );
}
