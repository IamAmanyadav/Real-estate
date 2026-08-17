"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";
import NavbarFilterBar, { type ViewMode } from "@/components/properties/NavbarFilterBar";
import PropertyGrid from "@/components/properties/PropertyGrid";
import { getProperties } from "@/lib/api";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import type { Property, PropertyFilters } from "@/types";

interface BrowsePropertiesViewProps {
  isDashboard?: boolean;
}

function BrowsePropertiesContent({ isDashboard = false }: BrowsePropertiesViewProps) {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const { isSaved, savedCount } = useSavedProperties();

  const [filters, setFilters] = useState<PropertyFilters>(() => {
    const f: PropertyFilters = {};
    const loc = searchParams.get("location");
    const type = searchParams.get("type");
    const minP = searchParams.get("minPrice");
    const maxP = searchParams.get("maxPrice");
    const beds = searchParams.get("bedrooms");
    if (loc) f.location = loc;
    if (type) f.propertyType = type as PropertyFilters["propertyType"];
    if (minP) f.minPrice = Number(minP);
    if (maxP) f.maxPrice = Number(maxP);
    if (beds) f.bedrooms = Number(beds);
    return f;
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProperties(filters);
      setProperties(data.items);
      setTotal(data.total);
    } catch {
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleReset = () => {
    setFilters({});
    setShowSavedOnly(false);
  };

  const displayedProperties = useMemo(() => {
    if (!showSavedOnly) return properties;
    return properties.filter((p) => isSaved(p.id));
  }, [properties, showSavedOnly, isSaved]);

  const hasFilters = !!(
    filters.location ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.propertyType ||
    (filters.sortBy && filters.sortBy !== "newest") ||
    showSavedOnly
  );

  return (
    <div className={isDashboard ? "space-y-6" : "pt-20 sm:pt-24 pb-20"}>
      {/* Top Banner Header */}
      <div className={isDashboard ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3" />
              Explore Collections
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Browse Properties
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore available luxury listings, apartments, villas, and modern estates.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-card/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Verified Real Estate</span>
          </div>
        </motion.div>
      </div>

      {/* Filter Bar with Saved Toggle */}
      <NavbarFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleReset}
        totalResults={displayedProperties.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDashboard={isDashboard}
        showSavedOnly={showSavedOnly}
        onToggleSavedOnly={() => setShowSavedOnly((prev) => !prev)}
        savedCount={savedCount}
      />

      {/* Property Cards Grid Container */}
      <div className={isDashboard ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <PropertyGrid
          properties={displayedProperties}
          loading={loading}
          hasFilters={hasFilters}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export default function BrowsePropertiesView({ isDashboard = false }: BrowsePropertiesViewProps) {
  return (
    <Suspense
      fallback={
        <div className={isDashboard ? "space-y-6" : "pt-24 pb-16"}>
          <div className={isDashboard ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-muted rounded-2xl w-1/3" />
              <div className="h-14 bg-muted rounded-2xl w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 bg-muted rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <BrowsePropertiesContent isDashboard={isDashboard} />
    </Suspense>
  );
}
