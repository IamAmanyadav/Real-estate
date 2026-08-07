"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, RotateCcw, MapPin } from "lucide-react";
import {
  PROPERTY_TYPES,
  PRICE_RANGES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/constants";
import type { PropertyFilters } from "@/types";

interface FiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onReset: () => void;
}

export default function Filters({ filters, onFiltersChange, onReset }: FiltersProps) {
  const updateFilter = (key: keyof PropertyFilters, value: string | null) => {
    const newFilters = { ...filters };
    const v = value ?? "";

    if (key === "propertyType") {
      newFilters.propertyType = v === "all" ? undefined : (v as PropertyFilters["propertyType"]);
    } else if (key === "minPrice" || key === "maxPrice") {
      // Handle price range
      if (v === "any") {
        newFilters.minPrice = undefined;
        newFilters.maxPrice = undefined;
      } else {
        const [min, max] = v.split("-");
        newFilters.minPrice = Number(min);
        newFilters.maxPrice = Number(max);
      }
    } else if (key === "bedrooms") {
      newFilters.bedrooms = v === "any" ? undefined : Number(v);
    } else if (key === "bathrooms") {
      newFilters.bathrooms = v === "any" ? undefined : Number(v);
    } else if (key === "sortBy") {
      newFilters.sortBy = v as PropertyFilters["sortBy"];
    } else if (key === "location") {
      newFilters.location = v || undefined;
    }

    onFiltersChange(newFilters);
  };

  const currentPriceRange =
    filters.minPrice !== undefined && filters.maxPrice !== undefined
      ? `${filters.minPrice}-${filters.maxPrice}`
      : "any";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="City or neighborhood..."
            value={filters.location || ""}
            onChange={(e) => updateFilter("location", e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Property Type</Label>
        <Select
          value={filters.propertyType || "all"}
          onValueChange={(v) => updateFilter("propertyType", v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range</Label>
        <Select
          value={currentPriceRange}
          onValueChange={(v) => updateFilter("minPrice", v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bedrooms</Label>
        <Select
          value={filters.bedrooms?.toString() || "any"}
          onValueChange={(v) => updateFilter("bedrooms", v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BEDROOM_OPTIONS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Bathrooms</Label>
        <Select
          value={filters.bathrooms?.toString() || "any"}
          onValueChange={(v) => updateFilter("bathrooms", v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BATHROOM_OPTIONS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={filters.sortBy || "newest"}
          onValueChange={(v) => updateFilter("sortBy", v)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
