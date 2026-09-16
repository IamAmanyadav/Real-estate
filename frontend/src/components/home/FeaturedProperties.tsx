"use client";

import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Property } from "@/types";
import { getProperties } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

const BACKEND_BASE = API_BASE_URL.replace("/api/v1", "").replace(/\/$/, "");
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
  if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
    return firstImage;
  }
  if (firstImage.startsWith("/uploads")) {
    return `${BACKEND_BASE}${firstImage}`;
  }
  if (firstImage.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${firstImage}`;
  }
  if (firstImage.startsWith("/")) {
    return firstImage;
  }
  return `${BACKEND_BASE}/${firstImage}`;
}

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProperties() {
      try {
        const data = await getProperties({ limit: 6, sortBy: "newest" });
        setProperties(data.items);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const handlePropertyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <div className="w-full mt-10 z-10 relative">
      {/* Property Grid */}
      {loading ? (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 perspective-1000">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-[400px] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-pulse overflow-hidden aspect-[4/3]"
            />
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 perspective-1000">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: Math.min(index * 0.1, 0.4), duration: 0.6, type: "spring", stiffness: 100 }}
              className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-[400px] group relative cursor-pointer rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl hover:shadow-emerald-500/30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-white/10"
              onClick={handlePropertyClick}
            >
              {/* Image */}
              <Image
                src={resolveImageUrl(property.images)}
                alt={property.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              
              {/* Glassmorphism Title Banner */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-white/10 backdrop-blur-sm border-t border-white/20 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 group-hover:bg-white/20">
                <h3 className="text-sm sm:text-lg font-bold text-white line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-left">
                  {property.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
