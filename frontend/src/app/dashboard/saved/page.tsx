"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyGrid from "@/components/properties/PropertyGrid";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { getProperties } from "@/lib/api";
import type { Property } from "@/types";

export default function SavedPropertiesPage() {
  const { savedIds, savedCount } = useSavedProperties();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      setLoading(true);
      try {
        const data = await getProperties({});
        const filtered = (data.items || []).filter((p) => savedIds.includes(p.id));
        setProperties(filtered);
      } catch (err) {
        console.error("Failed to load properties:", err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, [savedIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            Your Favorites
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Saved Properties</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {savedCount > 0
              ? `You have saved ${savedCount} propert${savedCount === 1 ? "y" : "ies"}`
              : "Properties you save will appear here for easy access."}
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="rounded-xl border-border/80 text-xs sm:text-sm font-semibold h-10 shadow-sm"
        >
          <Link href="/dashboard/properties">
            <Building2 className="w-4 h-4 mr-2 text-emerald-500" />
            Browse All Listings
          </Link>
        </Button>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground mt-3">Loading your saved properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 px-4 bg-card/40 rounded-3xl border border-dashed border-border/80"
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-md">
            <Heart className="w-8 h-8 text-rose-500/70" />
          </div>
          <h3 className="text-lg font-bold mb-1">No Saved Properties Yet</h3>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-sm mx-auto mb-6">
            Click the heart icon on any property while browsing to save your favorite listings here.
          </p>
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 font-semibold"
          >
            <Link href="/dashboard/properties">
              Explore Properties
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      ) : (
        <PropertyGrid properties={properties} loading={false} viewMode="grid" />
      )}
    </div>
  );
}
