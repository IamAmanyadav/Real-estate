"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Building2,
  DollarSign,
  BedDouble,
  Bath,
  ArrowUpDown,
  RotateCcw,
  LayoutGrid,
  List,
  X,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  PROPERTY_TYPES,
  PRICE_RANGES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/constants";
import type { PropertyFilters } from "@/types";

export type ViewMode = "grid" | "list";

interface NavbarFilterBarProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onReset: () => void;
  totalResults: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function NavbarFilterBar({
  filters,
  onFiltersChange,
  onReset,
  totalResults,
  viewMode,
  onViewModeChange,
}: NavbarFilterBarProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const updateFilter = (key: keyof PropertyFilters, value: string | null) => {
    const newFilters = { ...filters };
    const v = value ?? "";

    if (key === "propertyType") {
      newFilters.propertyType = v === "all" ? undefined : (v as PropertyFilters["propertyType"]);
    } else if (key === "minPrice" || key === "maxPrice") {
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

  const activeFiltersCount = [
    filters.location,
    filters.propertyType,
    filters.minPrice !== undefined || filters.maxPrice !== undefined ? true : undefined,
    filters.bedrooms,
    filters.bathrooms,
    filters.sortBy && filters.sortBy !== "newest" ? filters.sortBy : undefined,
  ].filter(Boolean).length;

  const getTypeLabel = (val?: string) =>
    PROPERTY_TYPES.find((t) => t.value === val)?.label || val;

  const getPriceLabel = (val: string) =>
    PRICE_RANGES.find((r) => r.value === val)?.label || val;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 lg:top-20 z-40 w-full bg-background/90 backdrop-blur-xl border-y border-border/60 shadow-sm transition-all duration-300 py-2.5 mb-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
        {/* Mobile Bar View (< md) */}
        <div className="flex md:hidden items-center justify-between gap-2 w-full">
          {/* Location Input */}
          <div className="relative flex-1 min-w-0">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="City or location..."
              value={filters.location || ""}
              onChange={(e) => updateFilter("location", e.target.value)}
              className="pl-9 pr-7 h-10 rounded-xl bg-card border-border/80 text-sm shadow-sm"
            />
            {filters.location && (
              <button
                onClick={() => updateFilter("location", "")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Slider Drawer Trigger */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 rounded-xl border-emerald-500/40 bg-card text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-emerald-500 text-white rounded-full px-1.5 py-0.2 text-[10px] ml-0.5">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              }
            />
            <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl p-5 overflow-y-auto">
              <SheetHeader className="p-0 pb-3 border-b border-border/60">
                <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
                  Filter Properties
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Filter Controls List */}
              <div className="space-y-4 py-4">
                {/* Property Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Property Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTY_TYPES.map((t) => {
                      const selected = (filters.propertyType || "all") === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => updateFilter("propertyType", t.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                            selected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-card border-border hover:bg-accent text-foreground"
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Price Range
                  </label>
                  <Select
                    value={currentPriceRange}
                    onValueChange={(v) => updateFilter("minPrice", v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                      <SelectValue placeholder="Price Range" />
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

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Bedrooms
                    </label>
                    <Select
                      value={filters.bedrooms?.toString() || "any"}
                      onValueChange={(v) => updateFilter("bedrooms", v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                        <SelectValue placeholder="Beds" />
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Bathrooms
                    </label>
                    <Select
                      value={filters.bathrooms?.toString() || "any"}
                      onValueChange={(v) => updateFilter("bathrooms", v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                        <SelectValue placeholder="Baths" />
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
                </div>

                {/* Sort By */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sort By
                  </label>
                  <Select
                    value={filters.sortBy || "newest"}
                    onValueChange={(v) => updateFilter("sortBy", v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                      <SelectValue placeholder="Sort By" />
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

              {/* Sheet Actions */}
              <SheetFooter className="p-0 pt-3 border-t border-border/60 flex flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={onReset}
                  className="flex-1 rounded-xl h-11 border-dashed"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  onClick={() => setMobileSheetOpen(false)}
                  className="flex-1 rounded-xl h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Show Results ({totalResults})
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold ${
                viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={`h-8 px-2.5 rounded-lg text-xs font-semibold ${
                viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Desktop Bar View (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {/* Main Horizontal Filter Controls */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-nowrap flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative w-48 sm:w-56 shrink-0">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <Input
                placeholder="City or location..."
                value={filters.location || ""}
                onChange={(e) => updateFilter("location", e.target.value)}
                className="pl-9 pr-8 h-10 rounded-xl bg-card border-border/80 focus-visible:ring-emerald-500 text-sm shadow-sm"
              />
              {filters.location && (
                <button
                  onClick={() => updateFilter("location", "")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Property Type Dropdown */}
            <Select
              value={filters.propertyType || "all"}
              onValueChange={(v) => updateFilter("propertyType", v)}
            >
              <SelectTrigger className="h-10 w-36 sm:w-40 shrink-0 rounded-xl bg-card border-border/80 text-sm shadow-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Property Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-sm">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range Dropdown */}
            <Select
              value={currentPriceRange}
              onValueChange={(v) => updateFilter("minPrice", v)}
            >
              <SelectTrigger className="h-10 w-36 sm:w-40 shrink-0 rounded-xl bg-card border-border/80 text-sm shadow-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Price Range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-sm">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bedrooms Dropdown */}
            <Select
              value={filters.bedrooms?.toString() || "any"}
              onValueChange={(v) => updateFilter("bedrooms", v)}
            >
              <SelectTrigger className="h-10 w-28 sm:w-32 shrink-0 rounded-xl bg-card border-border/80 text-sm shadow-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <BedDouble className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Beds" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BEDROOM_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value} className="text-sm">
                    {b.label === "Any" ? "Any Beds" : `${b.label} Bedrooms`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bathrooms Dropdown */}
            <Select
              value={filters.bathrooms?.toString() || "any"}
              onValueChange={(v) => updateFilter("bathrooms", v)}
            >
              <SelectTrigger className="h-10 w-28 sm:w-32 shrink-0 rounded-xl bg-card border-border/80 text-sm shadow-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Bath className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Baths" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BATHROOM_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value} className="text-sm">
                    {b.label === "Any" ? "Any Baths" : `${b.label} Bathrooms`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select
              value={filters.sortBy || "newest"}
              onValueChange={(v) => updateFilter("sortBy", v)}
            >
              <SelectTrigger className="h-10 w-40 sm:w-44 shrink-0 rounded-xl bg-card border-border/80 text-sm shadow-sm font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Sort By" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-sm">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right Action Tools (View Mode & Reset) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5 mr-1" />
                List
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="h-9 px-3 rounded-xl border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium shrink-0"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips & Results Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Active:
            </span>

            {activeFiltersCount === 0 ? (
              <span className="text-xs text-muted-foreground italic">None (All Properties)</span>
            ) : (
              <AnimatePresence>
                {filters.location && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      Location: {filters.location}
                      <button
                        onClick={() => updateFilter("location", "")}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}

                {filters.propertyType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                    >
                      Type: {getTypeLabel(filters.propertyType)}
                      <button
                        onClick={() => updateFilter("propertyType", "all")}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}

                {currentPriceRange !== "any" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                    >
                      Price: {getPriceLabel(currentPriceRange)}
                      <button
                        onClick={() => updateFilter("minPrice", "any")}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}

                {filters.bedrooms && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    >
                      Beds: {filters.bedrooms}+
                      <button
                        onClick={() => updateFilter("bedrooms", "any")}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}

                {filters.bathrooms && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                    >
                      Baths: {filters.bathrooms}+
                      <button
                        onClick={() => updateFilter("bathrooms", "any")}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Found <span className="font-bold text-foreground">{totalResults}</span> properties
          </div>
        </div>
      </div>
    </motion.div>
  );
}
