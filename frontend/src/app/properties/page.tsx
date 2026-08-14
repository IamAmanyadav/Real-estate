"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Sparkles } from "lucide-react";
import NavbarFilterBar, { type ViewMode } from "@/components/properties/NavbarFilterBar";
import PropertyGrid from "@/components/properties/PropertyGrid";
import { getProperties } from "@/lib/api";
import type { Property, PropertyFilters } from "@/types";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
  };

  const hasFilters = !!(
    filters.location ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.propertyType ||
    (filters.sortBy && filters.sortBy !== "newest")
  );

  return (
    <div className="pt-20 sm:pt-24 pb-20">
      {/* Top Banner Header */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Browse Properties
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-card/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Verified Real Estate</span>
          </div>
        </motion.div>
      </div>

      {/* Sticky Top Navbar Filter Bar */}
      <NavbarFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleReset}
        totalResults={total}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Property Cards Grid Container */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24">
        <PropertyGrid
          properties={properties}
          loading={loading}
          hasFilters={hasFilters}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16">
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24">
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
      <PropertiesContent />
    </Suspense>
  );
}
