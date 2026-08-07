"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, DollarSign, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, PRICE_RANGES, BEDROOM_OPTIONS } from "@/lib/constants";

interface SearchBarProps {
  variant?: "hero" | "compact";
  className?: string;
}

export default function SearchBar({ variant = "compact", className }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState("any");
  const [bedrooms, setBedrooms] = useState("any");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (propertyType && propertyType !== "all") params.set("type", propertyType);
    if (priceRange && priceRange !== "any") {
      const [min, max] = priceRange.split("-");
      params.set("minPrice", min);
      params.set("maxPrice", max);
    }
    if (bedrooms && bedrooms !== "any") params.set("bedrooms", bedrooms);
    router.push(`/properties?${params.toString()}`);
  };

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "bg-card/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl shadow-emerald-900/5 dark:shadow-black/20 border border-border",
          className
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="City, neighborhood..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-background border-border"
            />
          </div>

          {/* Property Type */}
          <Select value={propertyType} onValueChange={(v) => setPropertyType(v ?? "all")}>
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-500" />
                <SelectValue placeholder="Property Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Select value={priceRange} onValueChange={(v) => setPriceRange(v ?? "any")}>
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <SelectValue placeholder="Price Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bedrooms */}
          <div className="flex gap-2">
            <Select value={bedrooms} onValueChange={(v) => setBedrooms(v ?? "any")}>
              <SelectTrigger className="h-12 rounded-xl bg-background flex-1">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4 text-emerald-500" />
                  <SelectValue placeholder="Beds" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BEDROOM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSearch}
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10 h-11 rounded-xl"
        />
      </div>
      <Button
        onClick={handleSearch}
        className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6"
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
