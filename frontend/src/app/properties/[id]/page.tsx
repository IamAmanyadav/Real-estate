"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  ArrowLeft,
  Heart,
  Share2,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Clock,
  CalendarCheck,
  Loader2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ContactForm from "@/components/contact/ContactForm";
import { getPropertyById } from "@/lib/api";
import { getPropertyAvailability, createAppointment } from "@/lib/appointment-api";
import { formatPrice } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import type { Property, TimeSlot } from "@/types";

const BACKEND_BASE = API_BASE_URL.replace("/api/v1", "").replace(/\/$/, "");

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&auto=format&fit=crop&q=85";

function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) return DEFAULT_FALLBACK_IMAGE;

  let cleaned = url.trim();
  if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleaned = parsed[0];
      }
    } catch {}
  }

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  if (cleaned.startsWith("/uploads")) {
    return `${BACKEND_BASE}${cleaned}`;
  }
  if (cleaned.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${cleaned}`;
  }
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  return `${BACKEND_BASE}/${cleaned}`;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Schedule visit state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    async function fetchProperty() {
      try {
        const data = await getPropertyById(params.id as string);
        setProperty(data);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [params.id]);

  useEffect(() => {
    async function fetchSlots() {
      if (!params.id) return;
      setSlotsLoading(true);
      try {
        const slots = await getPropertyAvailability(params.id as string);
        setTimeSlots(slots);
      } catch {
        setTimeSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [params.id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, property?.images?.length]);

  const handleBookVisit = async () => {
    if (!selectedSlot || !property) return;
    setBooking(true);
    setBookingError("");
    try {
      await createAppointment({ propertyId: property.id, timeSlotId: selectedSlot });
      setBookingSuccess(true);
      setSelectedSlot(null);
      const slots = await getPropertyAvailability(params.id as string);
      setTimeSlots(slots);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401) {
        setBookingError("Please log in as a buyer to schedule a visit.");
      } else {
        setBookingError(typeof detail === "string" ? detail : "Failed to book visit.");
      }
    } finally {
      setBooking(false);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!property?.images?.length) return;
    setSelectedImage((prev) => (prev + 1) % property.images.length);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!property?.images?.length) return;
    setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-[450px] sm:h-[600px] bg-muted rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-32 bg-muted rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="h-64 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The property you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/properties">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    for_sale: "For Sale",
    for_rent: "For Rent",
    sold: "Sold",
    pending: "Pending",
  };

  const imagesList =
    property.images && property.images.length > 0 ? property.images : [DEFAULT_FALLBACK_IMAGE];

  return (
    <div className="pt-20 sm:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Navigation Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <Link href="/properties">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLightboxOpen(true)}
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fullscreen View</span>
            </Button>
          </div>
        </motion.div>

        {/* ── GRAND IMMERSIVE HERO PHOTO GALLERY ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Main Grand Photo Display Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Grand Main Photo */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="lg:col-span-9 relative h-[380px] sm:h-[520px] lg:h-[620px] xl:h-[680px] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-border/60 bg-muted"
            >
              <img
                src={resolveImageUrl(imagesList[selectedImage])}
                alt={property.title}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                }}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
              />

              {/* Ambient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 opacity-90 group-hover:opacity-75 transition-opacity" />

              {/* Left / Right Nav Arrows directly on Main Photo */}
              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3.5 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Top Badges & Fullscreen Trigger */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <Badge className="bg-emerald-500/90 backdrop-blur-md text-white border-0 rounded-full px-3.5 py-1 text-xs font-semibold shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {statusLabels[property.status]} • {property.propertyType}
                </Badge>

                <div className="bg-black/60 backdrop-blur-md hover:bg-black/85 text-white px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-lg transition-all">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Click for Fullscreen View</span>
                </div>
              </div>

              {/* Bottom Overlay Info & Photo Counter */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white z-10">
                <div className="max-w-xl">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white drop-shadow-lg line-clamp-1">
                    {property.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-200 drop-shadow flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {property.address}, {property.city}, {property.state}
                    </span>
                  </p>
                </div>

                <div className="bg-black/75 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 shadow-lg shrink-0 ml-3">
                  Photo {selectedImage + 1} of {imagesList.length}
                </div>
              </div>
            </div>

            {/* Right Side Thumbnails Strip (Desktop >= lg) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 h-[620px] xl:h-[680px]">
              {imagesList.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative flex-1 rounded-2xl overflow-hidden border-2 transition-all group bg-muted ${
                    selectedImage === i
                      ? "border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`View ${i + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {i === 3 && imagesList.length > 4 && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white font-bold text-base">
                      +{imagesList.length - 4} More Photos
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Horizontal Thumbnails Strip (All Screen Sizes) */}
          {imagesList.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto py-2 scrollbar-none">
              {imagesList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-28 sm:w-36 h-20 sm:h-24 rounded-2xl overflow-hidden border-2 shrink-0 transition-all bg-muted ${
                    selectedImage === i
                      ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`View ${i + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── FULLSCREEN HD LIGHTBOX MODAL ────────────────────────────────────── */}
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between text-white z-10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15">
                    {selectedImage + 1} / {imagesList.length}
                  </span>
                  <span className="text-sm font-medium text-gray-200 hidden sm:inline truncate max-w-lg">
                    {property.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full w-11 h-11 transition-colors"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Main HD Image Display */}
              <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
                {imagesList.length > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 sm:left-8 z-20 p-3.5 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all shadow-2xl hover:scale-110"
                    title="Previous"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                )}

                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  src={resolveImageUrl(imagesList[selectedImage])}
                  alt={property.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                  }}
                  className="max-h-[85vh] max-w-[94vw] object-contain rounded-2xl shadow-2xl"
                />

                {imagesList.length > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-8 z-20 p-3.5 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all shadow-2xl hover:scale-110"
                    title="Next"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnails Navigation Strip */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
                {imagesList.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-18 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === i
                        ? "border-emerald-500 scale-110 ring-2 ring-emerald-500/60 shadow-lg"
                        : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PROPERTY OVERVIEW & CORE INFORMATION (FULL WIDTH) ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Header Title & Price Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                {property.propertyCode && (
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 rounded-full font-mono text-xs">
                    {property.propertyCode}
                  </Badge>
                )}
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 rounded-full font-semibold">
                  {statusLabels[property.status]}
                </Badge>
                <Badge variant="outline" className="rounded-full capitalize font-medium">
                  {property.propertyType}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zipCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Listing Price
                </p>
                <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {formatPrice(property.price)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-xl h-11 w-11 ${
                    isFavorite ? "text-red-500 border-red-500/30 bg-red-500/10" : ""
                  }`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Key Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              {
                icon: BedDouble,
                label: "Bedrooms",
                value: `${property.bedrooms} Beds`,
              },
              {
                icon: Bath,
                label: "Bathrooms",
                value: `${property.bathrooms} Baths`,
              },
              {
                icon: Maximize,
                label: "Property Area",
                value: `${property.area?.toLocaleString()} sqft`,
              },
              {
                icon: Calendar,
                label: "Year Built",
                value: property.yearBuilt,
              },
            ].map((detail) => (
              <Card
                key={detail.label}
                className="border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl py-4"
              >
                <CardContent className="p-0 text-center space-y-1">
                  <detail.icon className="w-5 h-5 text-emerald-500 mx-auto" />
                  <div className="text-base font-bold text-foreground">{detail.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{detail.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Description Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              About This Property
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {property.description}
            </p>
          </div>

          {/* Features & Amenities (Horizontal Compact Badges) */}
          {property.features && property.features.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                Features & Amenities
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {property.features.map((feature) => (
                  <div
                    key={feature}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-xs sm:text-sm font-medium text-foreground shadow-2xs hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <Separator className="my-8" />

        {/* ── PROFESSIONAL COMPACT ACTION CARDS (DOWN SIDE) ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              Connect & Tour
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Inquire, Tour, or Schedule a Visit
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Choose your preferred way to connect with the listing team or book an in-person viewing.
            </p>
          </div>

          {/* 3-Column Compact Professional Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* 1. GET IN TOUCH (SMALL CARD) */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="p-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Get In Touch</h3>
                    <p className="text-xs text-muted-foreground">Direct Agent Contact</p>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                    <p className="font-semibold text-foreground">
                      {property.agent?.name || "Verified Listing Agent"}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {property.agent?.title || "Real Estate Specialist"}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Have urgent questions about pricing, paperwork, or terms? Contact the agent directly.
                  </p>
                </CardContent>
              </div>

              <div className="p-4 pt-0 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-xl h-10 text-xs font-semibold border-border hover:border-emerald-500/40"
                  asChild
                >
                  <a href={`tel:${property.agent?.phone || "+1 (555) 000-0000"}`}>
                    <Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                    Call {property.agent?.phone || "+1 (555) 000-0000"}
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-xl h-10 text-xs font-semibold border-border hover:border-emerald-500/40"
                  asChild
                >
                  <a
                    href={`mailto:${
                      property.agent?.email || "info@luxeestates.com"
                    }?subject=Inquiry: ${encodeURIComponent(property.title)}`}
                  >
                    <Mail className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                    Send Direct Email
                  </a>
                </Button>
              </div>
            </Card>

            {/* 2. SCHEDULE VISIT (SMALL CARD) */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="p-4 border-b border-border/50 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Schedule a Visit</h3>
                    <p className="text-xs text-muted-foreground">Book In-Person Tour</p>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="p-3 rounded-xl bg-muted/40 text-center py-5">
                      <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1 opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No visit slots currently available. Send an inquiry below to request a private tour.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {Object.entries(
                        timeSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
                          (acc[slot.slotDate] = acc[slot.slotDate] || []).push(slot);
                          return acc;
                        }, {})
                      ).map(([date, slots]) => (
                        <div key={date}>
                          <p className="text-[11px] font-bold text-muted-foreground mb-1">
                            {new Date(date + "T00:00:00").toLocaleDateString("en", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {slots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() =>
                                  setSelectedSlot(selectedSlot === slot.id ? null : slot.id)
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                  selectedSlot === slot.id
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                    : "border-border bg-muted/30 hover:bg-emerald-500/10 text-foreground"
                                }`}
                              >
                                {slot.startTime} – {slot.endTime}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {bookingSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Visit booked! Check your dashboard.
                    </div>
                  )}
                  {bookingError && <p className="text-xs text-red-500">{bookingError}</p>}
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Button
                  onClick={handleBookVisit}
                  disabled={!selectedSlot || booking || bookingSuccess}
                  size="sm"
                  className="w-full rounded-xl h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  {booking && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {selectedSlot ? "Confirm Visit Booking" : "Select Slot Above"}
                </Button>
              </div>
            </Card>

            {/* 3. SEND ENQUIRY (SMALL CARD) */}
            <Card className="border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                <div className="p-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Send Enquiry</h3>
                    <p className="text-xs text-muted-foreground">Quick Response</p>
                  </div>
                </div>

                <CardContent className="p-4">
                  <ContactForm propertyId={property.id} compact />
                </CardContent>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
