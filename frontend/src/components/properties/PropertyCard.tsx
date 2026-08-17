"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Bath, Maximize, MapPin, Heart, Building2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import type { Property } from "@/types";
import type { ViewMode } from "./NavbarFilterBar";

interface PropertyCardProps {
  property: Property;
  index?: number;
  viewMode?: ViewMode;
}

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80";

function resolveImageUrl(images?: string[] | string | null): string {
  if (!images) return DEFAULT_FALLBACK_IMAGE;

  let firstImage: string | null = null;

  if (Array.isArray(images) && images.length > 0) {
    firstImage = images[0];
  } else if (typeof images === "string") {
    if (images.startsWith("[") || images.startsWith("{")) {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          firstImage = parsed[0];
        }
      } catch {
        firstImage = images;
      }
    } else {
      firstImage = images;
    }
  }

  if (!firstImage || typeof firstImage !== "string" || !firstImage.trim()) {
    return DEFAULT_FALLBACK_IMAGE;
  }

  firstImage = firstImage.trim();

  // Handle absolute HTTP/HTTPS URL
  if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
    return firstImage;
  }

  // Handle backend upload paths (/uploads/... or uploads/...)
  const backendBase = API_BASE_URL.replace("/api/v1", "").replace(/\/$/, "");
  if (firstImage.startsWith("/uploads")) {
    return `${backendBase}${firstImage}`;
  }
  if (firstImage.startsWith("uploads/")) {
    return `${backendBase}/${firstImage}`;
  }

  // Handle relative frontend static assets (/images/...)
  if (firstImage.startsWith("/")) {
    return firstImage;
  }

  return `${backendBase}/${firstImage}`;
}

export default function PropertyCard({ property, index = 0, viewMode = "grid" }: PropertyCardProps) {
  const { isSaved, toggleSave } = useSavedProperties();
  const isFavorite = isSaved(property.id);
  const [imgSrc, setImgSrc] = useState<string>(() => resolveImageUrl(property.images));
  const [imgError, setImgError] = useState(false);

  const statusColors: Record<string, string> = {
    for_sale: "bg-emerald-500 text-white shadow-emerald-500/25",
    for_rent: "bg-blue-500 text-white shadow-blue-500/25",
    sold: "bg-red-500 text-white shadow-red-500/25",
    pending: "bg-amber-500 text-white shadow-amber-500/25",
  };

  const statusLabels: Record<string, string> = {
    for_sale: "For Sale",
    for_rent: "For Rent",
    sold: "Sold",
    pending: "Pending",
  };

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(DEFAULT_FALLBACK_IMAGE);
    }
  };

  // ── List View (Horizontal Card) ─────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      >
        <Link href={`/properties/${property.id}`}>
          <Card className="group overflow-hidden border-border/60 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 py-0 gap-0 rounded-2xl bg-card">
            <div className="flex flex-col sm:flex-row min-h-[170px]">
              {/* Image Section */}
              <div className="relative sm:w-60 md:w-72 lg:w-80 shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden bg-muted">
                <img
                  src={imgSrc}
                  alt={property.title}
                  onError={handleImageError}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

                {/* Status Badge */}
                <Badge
                  className={`absolute top-2.5 left-2.5 ${
                    statusColors[property.status] || "bg-emerald-500 text-white"
                  } border-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-md`}
                >
                  {statusLabels[property.status] || property.status}
                </Badge>

                {/* Favorite Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full backdrop-blur-md border-0 transition-colors ${
                    isFavorite
                      ? "bg-red-500 text-white"
                      : "bg-black/30 hover:bg-black/50 text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSave(property.id);
                  }}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
                </Button>
              </div>

              {/* Content Section */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {property.propertyType}
                      </span>
                      <h3 className="font-bold text-foreground text-base sm:text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="line-clamp-1">
                          {property.address ? `${property.address}, ` : ""}
                          {property.city}, {property.state}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatPrice(property.price)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Footer Specs & Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{property.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{property.bathrooms} Baths</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{property.area?.toLocaleString()} sqft</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  // ── Grid View (Responsive Vertical Card) ──────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="h-full"
    >
      <Link href={`/properties/${property.id}`} className="block h-full">
        <Card className="group h-full flex flex-col justify-between overflow-hidden border-border/60 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 py-0 gap-0 rounded-2xl bg-card">
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden bg-muted shrink-0">
            <img
              src={imgSrc}
              alt={property.title}
              onError={handleImageError}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Status Badge */}
            <Badge
              className={`absolute top-2.5 left-2.5 ${
                statusColors[property.status] || "bg-emerald-500 text-white"
              } border-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-md`}
            >
              {statusLabels[property.status] || property.status}
            </Badge>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full backdrop-blur-md border-0 transition-colors ${
                isFavorite
                  ? "bg-red-500 text-white"
                  : "bg-black/30 hover:bg-black/50 text-white"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSave(property.id);
              }}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
            </Button>

            {/* Price & Type Overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
              <div className="text-lg sm:text-xl font-bold text-white drop-shadow-md truncate">
                {formatPrice(property.price)}
              </div>
              <Badge
                variant="outline"
                className="bg-black/40 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-medium tracking-wide shrink-0"
              >
                {property.propertyType}
              </Badge>
            </div>
          </div>

          {/* Content Details */}
          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="line-clamp-1">
                  {property.city}, {property.state}
                </span>
              </div>
            </div>

            {/* Features Specs Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
                <span>{property.bedrooms} Beds</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-emerald-500" />
                <span>{property.bathrooms} Baths</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-emerald-500" />
                <span>{property.area?.toLocaleString()} sqft</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
