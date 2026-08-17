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
  Search,
  Heart,
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
  isDashboard?: boolean;
  showSavedOnly?: boolean;
  onToggleSavedOnly?: () => void;
  savedCount?: number;
}

export default function NavbarFilterBar({
  filters,
  onFiltersChange,
  onReset,
  totalResults,
  viewMode,
  onViewModeChange,
  isDashboard = false,
  showSavedOnly = false,
  onToggleSavedOnly,
  savedCount = 0,
}: NavbarFilterBarProps) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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
    currentPriceRange !== "any",
    filters.bedrooms,
    filters.bathrooms,
    filters.sortBy && filters.sortBy !== "newest",
    showSavedOnly,
  ].filter(Boolean).length;

  const getTypeLabel = (val: string) =>
    PROPERTY_TYPES.find((t) => t.value === val)?.label || val;

  const getPriceLabel = (val: string) =>
    PRICE_RANGES.find((r) => r.value === val)?.label || val;

  return (
    <div
      className={`sticky ${
        isDashboard
          ? "top-16 z-20 rounded-2xl border bg-card/80 backdrop-blur-xl border-border/60 shadow-sm"
          : "top-16 lg:top-20 z-40 border-y bg-background/90 backdrop-blur-xl border-border/60 shadow-sm"
      } w-full transition-all duration-300 py-3 mb-6`}
    >
      <div className={isDashboard ? "px-3 sm:px-4 space-y-2.5" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5"}>
        {/* Main Clean Universal Bar (All Screen Sizes) */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          {/* Location / Keyword Search Bar */}
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="Search by city, address, or state..."
              value={filters.location || ""}
              onChange={(e) => updateFilter("location", e.target.value)}
              className="pl-9.5 pr-8 h-10.5 rounded-xl bg-card border-border/80 text-sm focus-visible:ring-emerald-500 shadow-sm"
            />
            {filters.location && (
              <button
                onClick={() => updateFilter("location", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Saved Button, Unified Filter Button & View Mode Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Saved Properties Quick Filter Button */}
            {onToggleSavedOnly && (
              <Button
                variant="outline"
                onClick={onToggleSavedOnly}
                className={`h-10.5 px-3 sm:px-3.5 rounded-xl border font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                  showSavedOnly
                    ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-border/80 bg-card hover:bg-accent text-foreground"
                }`}
                title={showSavedOnly ? "Showing Saved Properties" : "Filter by Saved Properties"}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    showSavedOnly ? "fill-rose-500 text-rose-500 scale-110" : "text-rose-500"
                  }`}
                />
                <span className="hidden sm:inline">Saved</span>
                {savedCount > 0 && (
                  <span
                    className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-sm ${
                      showSavedOnly ? "bg-rose-500" : "bg-muted-foreground/60"
                    }`}
                  >
                    {savedCount}
                  </span>
                )}
              </Button>
            )}

            {/* Unified All-in-One Filter Button Trigger */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    className={`h-10.5 px-3 sm:px-3.5 rounded-xl border font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm ${
                      activeFiltersCount > (showSavedOnly ? 1 : 0)
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border/80 bg-card hover:bg-accent text-foreground"
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                    <span>All Filters</span>
                    {activeFiltersCount > (showSavedOnly ? 1 : 0) && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                        {activeFiltersCount - (showSavedOnly ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                }
              />

              {/* Slide-over Filter Drawer (Works on all screen sizes) */}
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card">
                {/* Header */}
                <SheetHeader className="px-6 py-4.5 border-b border-border/60 text-left">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
                      <SlidersHorizontal className="w-5 h-5 text-emerald-500" />
                      Filter Properties
                    </SheetTitle>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Reset All
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                {/* Filter Options Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Property Type */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      Property Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PROPERTY_TYPES.map((t) => {
                        const isSelected = (filters.propertyType || "all") === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => updateFilter("propertyType", t.value)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-semibold"
                                : "bg-muted/40 border-border hover:bg-accent text-foreground"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      Price Range
                    </label>
                    <Select
                      value={currentPriceRange}
                      onValueChange={(v) => updateFilter("minPrice", v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border">
                        <SelectValue placeholder="Any Price" />
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
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-emerald-500" />
                      Bedrooms
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {BEDROOM_OPTIONS.map((b) => {
                        const isSelected = (filters.bedrooms?.toString() || "any") === b.value;
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => updateFilter("bedrooms", b.value)}
                            className={`py-2 rounded-xl text-xs font-medium border transition-all text-center ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-semibold"
                                : "bg-muted/40 border-border hover:bg-accent text-foreground"
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Bath className="w-3.5 h-3.5 text-emerald-500" />
                      Bathrooms
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {BATHROOM_OPTIONS.map((b) => {
                        const isSelected = (filters.bathrooms?.toString() || "any") === b.value;
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => updateFilter("bathrooms", b.value)}
                            className={`py-2 rounded-xl text-xs font-medium border transition-all text-center ${
                              isSelected
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-semibold"
                                : "bg-muted/40 border-border hover:bg-accent text-foreground"
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
                      Sort Order
                    </label>
                    <Select
                      value={filters.sortBy || "newest"}
                      onValueChange={(v) => updateFilter("sortBy", v)}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border">
                        <SelectValue placeholder="Sort Order" />
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

                {/* Footer Action Buttons */}
                <SheetFooter className="p-4 border-t border-border/60 flex flex-row gap-2 bg-card">
                  <Button
                    variant="outline"
                    onClick={onReset}
                    className="flex-1 rounded-xl h-11 border-border font-semibold text-xs"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => setFilterSheetOpen(false)}
                    className="flex-[2] rounded-xl h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Show {totalResults} Properties
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className={`h-8.5 px-2.5 rounded-lg text-xs font-semibold ${
                  viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange("list")}
                className={`h-8.5 px-2.5 rounded-lg text-xs font-semibold ${
                  viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar (Shows active applied filters with 1-click remove) */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none flex-wrap"
          >
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
              Active:
            </span>

            {showSavedOnly && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Saved Only ({savedCount})</span>
                {onToggleSavedOnly && (
                  <button
                    onClick={onToggleSavedOnly}
                    className="hover:bg-rose-500/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            )}

            {filters.location && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Location: {filters.location}</span>
                <button
                  onClick={() => updateFilter("location", "")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.propertyType && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Type: {getTypeLabel(filters.propertyType)}</span>
                <button
                  onClick={() => updateFilter("propertyType", "all")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {currentPriceRange !== "any" && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Price: {getPriceLabel(currentPriceRange)}</span>
                <button
                  onClick={() => updateFilter("minPrice", "any")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.bedrooms && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Beds: {filters.bedrooms}+</span>
                <button
                  onClick={() => updateFilter("bedrooms", "any")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.bathrooms && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Baths: {filters.bathrooms}+</span>
                <button
                  onClick={() => updateFilter("bathrooms", "any")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.sortBy && filters.sortBy !== "newest" && (
              <Badge
                variant="secondary"
                className="gap-1.5 py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>
                  Sort: {SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label}
                </span>
                <button
                  onClick={() => updateFilter("sortBy", "newest")}
                  className="hover:bg-emerald-500/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <button
              onClick={onReset}
              className="text-[11px] text-muted-foreground hover:text-destructive underline ml-1 cursor-pointer font-medium"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
