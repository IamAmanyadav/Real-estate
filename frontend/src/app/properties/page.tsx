"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import Filters from "@/components/properties/Filters";
import PropertyGrid from "@/components/properties/PropertyGrid";
import { getProperties } from "@/lib/api";
import type { Property, PropertyFilters } from "@/types";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

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

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Property Listings</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Browse {total > 0 ? `${total} ` : ""}available properties matching
            your criteria.
          </p>
        </motion.div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              <Filters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* Property Grid */}
          <div className="flex-1 min-w-0">
            <PropertyGrid
              properties={properties}
              loading={loading}
              hasFilters={!!(filters.location || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.bathrooms || filters.propertyType || filters.sortBy)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-muted rounded w-1/3" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      }
    >
      <PropertiesContent />
    </Suspense>
  );
}
