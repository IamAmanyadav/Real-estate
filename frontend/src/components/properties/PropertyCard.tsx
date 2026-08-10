"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Bath, Maximize, MapPin, Heart, Building2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";
import type { ViewMode } from "./NavbarFilterBar";

interface PropertyCardProps {
  property: Property;
  index?: number;
  viewMode?: ViewMode;
}

export default function PropertyCard({ property, index = 0, viewMode = "grid" }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

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

  const imageUrl =
    property.images && property.images.length > 0
      ? property.images[0].startsWith("/uploads")
        ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${property.images[0]}`
        : property.images[0]
      : null;

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, delay: index * 0.05 }}
      >
        <Link href={`/properties/${property.id}`}>
          <Card className="group overflow-hidden border-border/60 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 py-0 gap-0 rounded-2xl">
            <div className="flex flex-col sm:flex-row min-h-[170px]">
              {/* Image Section */}
              <div className="relative sm:w-56 md:w-64 shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden">
                {imageUrl ? (
                  property.images[0].startsWith("/uploads") ? (
                    <img
                      src={imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 260px"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center min-h-[140px]">
                    <Building2 className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

                {/* Status Badge */}
                <Badge
                  className={`absolute top-2.5 left-2.5 ${statusColors[property.status]} border-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-md`}
                >
                  {statusLabels[property.status]}
                </Badge>

                {/* Favorite Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2.5 right-2.5 h-7.5 w-7.5 rounded-full backdrop-blur-md border-0 transition-colors ${
                    isFavorite
                      ? "bg-red-500 text-white"
                      : "bg-black/30 hover:bg-black/50 text-white"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsFavorite(!isFavorite);
                  }}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
                </Button>
              </div>

              {/* Content Section */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {property.propertyType}
                      </span>
                      <h3 className="font-bold text-foreground text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="line-clamp-1">
                          {property.address}, {property.city}, {property.state}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatPrice(property.price)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {property.description}
                  </p>
                </div>

                {/* Footer Specs & Action */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                  <div className="flex items-center gap-3.5 text-xs text-muted-foreground font-medium">
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
                      <span>{property.area.toLocaleString()} sqft</span>
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

  // Default Compact Grid View
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/properties/${property.id}`}>
        <Card className="group overflow-hidden border-border/60 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 py-0 gap-0 rounded-2xl">
          {/* Image Container */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {imageUrl ? (
              property.images[0].startsWith("/uploads") ? (
                <img
                  src={imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

            {/* Status Badge */}
            <Badge
              className={`absolute top-2.5 left-2.5 ${statusColors[property.status]} border-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-md`}
            >
              {statusLabels[property.status]}
            </Badge>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2.5 right-2.5 h-7.5 w-7.5 rounded-full backdrop-blur-md border-0 transition-colors ${
                isFavorite
                  ? "bg-red-500 text-white"
                  : "bg-black/30 hover:bg-black/50 text-white"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
            </Button>

            {/* Price Overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
              <div className="text-xl font-bold text-white drop-shadow-md">
                {formatPrice(property.price)}
              </div>
              <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/20 text-[10px] uppercase font-medium tracking-wide">
                {property.propertyType}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-3.5 space-y-2.5">
            <div>
              <h3 className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-xs line-clamp-1">
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
                <span>{property.area.toLocaleString()} sqft</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
