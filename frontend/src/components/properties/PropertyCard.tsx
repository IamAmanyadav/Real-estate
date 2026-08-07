"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Bath, Maximize, MapPin, Heart, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const statusColors: Record<string, string> = {
    for_sale: "bg-emerald-500 text-white",
    for_rent: "bg-blue-500 text-white",
    sold: "bg-red-500 text-white",
    pending: "bg-amber-500 text-white",
  };

  const statusLabels: Record<string, string> = {
    for_sale: "For Sale",
    for_rent: "For Rent",
    sold: "Sold",
    pending: "Pending",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/properties/${property.id}`}>
        <Card className="group overflow-hidden border-border/50 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-900/5 dark:hover:shadow-emerald-900/10 transition-all duration-300 py-0 gap-0">
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {property.images && property.images.length > 0 ? (
              property.images[0].startsWith("/uploads") ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${property.images[0]}`}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <Image
                  src={property.images[0]}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Status Badge */}
            <Badge
              className={`absolute top-3 left-3 ${statusColors[property.status]} border-0 rounded-full px-3 py-1 text-xs font-semibold shadow-lg`}
            >
              {statusLabels[property.status]}
            </Badge>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white border-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart className="w-4 h-4" />
            </Button>

            {/* Price */}
            <div className="absolute bottom-3 left-3">
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                {formatPrice(property.price)}
              </div>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground text-lg line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-sm line-clamp-1">
                  {property.city}, {property.state}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BedDouble className="w-4 h-4 text-emerald-500" />
                <span>{property.bedrooms} Beds</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Bath className="w-4 h-4 text-emerald-500" />
                <span>{property.bathrooms} Baths</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Maximize className="w-4 h-4 text-emerald-500" />
                <span>{property.area.toLocaleString()} ft²</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
