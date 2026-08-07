"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PropertyCard from "@/components/properties/PropertyCard";
import type { Property } from "@/types";
import { getProperties } from "@/lib/api";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await getProperties({ limit: 6, sortBy: "newest" });
        setProperties(data.items);
      } catch {
        // Fallback: use empty array (API not running)
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Featured Listings
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">
            Discover Our Top Properties
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hand-picked premium properties that offer the perfect blend of luxury,
            comfort, and value.
          </p>
        </motion.div>

        {/* Property Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-border animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <Building2 className="w-10 h-10 text-emerald-500/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Properties Available Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Stay tuned for upcoming listings. Our verified sellers are preparing
              exceptional properties for you.
            </p>
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            asChild
          >
            <Link href="/properties">
              View All Properties
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
