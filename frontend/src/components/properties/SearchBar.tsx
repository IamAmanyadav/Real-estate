"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Home,
  DollarSign,
  BedDouble,
  Bath,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  PROPERTY_TYPES,
  PRICE_RANGES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/constants";

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
  const [bathrooms, setBathrooms] = useState("any");
  const [sortBy, setSortBy] = useState("newest");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

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
    if (bathrooms && bathrooms !== "any") params.set("bathrooms", bathrooms);
    if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);

    setMobileSheetOpen(false);
    router.push(`/properties?${params.toString()}`);
  };

  const handleReset = () => {
    setLocation("");
    setPropertyType("all");
    setPriceRange("any");
    setBedrooms("any");
    setBathrooms("any");
    setSortBy("newest");
  };

  const activeFiltersCount = [
    location,
    propertyType !== "all" ? propertyType : undefined,
    priceRange !== "any" ? priceRange : undefined,
    bedrooms !== "any" ? bedrooms : undefined,
    bathrooms !== "any" ? bathrooms : undefined,
    sortBy !== "newest" ? sortBy : undefined,
  ].filter(Boolean).length;

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "bg-card/85 backdrop-blur-xl rounded-2xl p-3.5 sm:p-5 shadow-2xl shadow-emerald-900/10 dark:shadow-black/40 border border-border/80",
          className
        )}
      >
        {/* Mobile View (< md) */}
        <div className="flex md:hidden items-center gap-2 w-full">
          {/* Location Input */}
          <div className="relative flex-1 min-w-0">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="City, neighborhood..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-11 rounded-xl bg-background border-border text-sm"
            />
          </div>

          {/* Filter Drawer Sheet Button */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 px-3.5 rounded-xl border-emerald-500/40 bg-card text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm"
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
                  Search & Filter Properties
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Filter Controls */}
              <div className="space-y-4 py-4">
                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <Input
                      placeholder="City or neighborhood..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9 h-11 rounded-xl bg-card border-border"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Property Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTY_TYPES.map((t) => {
                      const selected = propertyType === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setPropertyType(t.value)}
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
                  <Select value={priceRange} onValueChange={(v) => setPriceRange(v ?? "any")}>
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
                    <Select value={bedrooms} onValueChange={(v) => setBedrooms(v ?? "any")}>
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
                    <Select value={bathrooms} onValueChange={(v) => setBathrooms(v ?? "any")}>
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
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "newest")}>
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

              {/* Mobile Drawer Footer */}
              <SheetFooter className="p-0 pt-3 border-t border-border/60 flex flex-row gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1 rounded-xl h-11 border-dashed">
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reset
                </Button>
                <Button
                  onClick={handleSearch}
                  className="flex-1 rounded-xl h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  Search Now
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Quick Search CTA Button */}
          <Button
            onClick={handleSearch}
            className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop View (>= md) */}
        <div className="hidden md:grid grid-cols-12 gap-3 items-center">
          {/* Location Input */}
          <div className="relative col-span-3">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            <Input
              placeholder="City, neighborhood..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-11 rounded-xl bg-background border-border text-sm"
            />
          </div>

          {/* Property Type */}
          <div className="col-span-2">
            <Select value={propertyType} onValueChange={(v) => setPropertyType(v ?? "all")}>
              <SelectTrigger className="h-11 rounded-xl bg-background text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Home className="w-4 h-4 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Type" />
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
          </div>

          {/* Price Range */}
          <div className="col-span-2">
            <Select value={priceRange} onValueChange={(v) => setPriceRange(v ?? "any")}>
              <SelectTrigger className="h-11 rounded-xl bg-background text-sm">
                <div className="flex items-center gap-2 truncate">
                  <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Price" />
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
          </div>

          {/* Bedrooms */}
          <div className="col-span-2">
            <Select value={bedrooms} onValueChange={(v) => setBedrooms(v ?? "any")}>
              <SelectTrigger className="h-11 rounded-xl bg-background text-sm">
                <div className="flex items-center gap-2 truncate">
                  <BedDouble className="w-4 h-4 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Beds" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BEDROOM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label === "Any" ? "Any Beds" : `${opt.label} Beds`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bathrooms */}
          <div className="col-span-2">
            <Select value={bathrooms} onValueChange={(v) => setBathrooms(v ?? "any")}>
              <SelectTrigger className="h-11 rounded-xl bg-background text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Bath className="w-4 h-4 text-emerald-500 shrink-0" />
                  <SelectValue placeholder="Baths" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BATHROOM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label === "Any" ? "Any Baths" : `${opt.label} Baths`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="col-span-1 flex justify-end">
            <Button
              onClick={handleSearch}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center"
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
        className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 font-medium"
      >
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
