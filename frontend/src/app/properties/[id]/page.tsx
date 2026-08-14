"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ContactForm from "@/components/contact/ContactForm";
import { getPropertyById } from "@/lib/api";
import { getPropertyAvailability, createAppointment } from "@/lib/appointment-api";
import { formatPrice } from "@/lib/utils";
import type { Property, TimeSlot } from "@/types";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
  : 'http://localhost:8000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('/uploads')) return `${BACKEND_BASE}${url}`;
  return url;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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

  const handleNextImage = () => {
    if (!property?.images?.length) return;
    setSelectedImage((prev) => (prev + 1) % property.images.length);
  };

  const handlePrevImage = () => {
    if (!property?.images?.length) return;
    setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-muted rounded w-32" />
            <div className="h-[400px] sm:h-[500px] bg-muted rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-32 bg-muted rounded" />
              </div>
              <div className="h-96 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-24 pb-16">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24 text-center py-20">
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

  return (
    <div className="pt-20 sm:pt-24 pb-16">

      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-24">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-6"
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
        </motion.div>

        {/* Grand Hero Photo Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {property.images && property.images.length > 0 ? (
            <div className="space-y-3">
              {/* Grand Main Photo Display */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="lg:col-span-3 relative h-[320px] sm:h-[450px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer border border-border/60"
                >
                  <img
                    src={resolveImageUrl(property.images[selectedImage])}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Fullscreen Expand Pill */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-lg transition-all">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Fullscreen</span>
                  </div>

                  {/* Image counter pill */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/10">
                    Photo {selectedImage + 1} of {property.images.length}
                  </div>

                  {/* Main Title Badge overlay */}
                  <div className="absolute bottom-4 left-4 right-20 hidden sm:block text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      {statusLabels[property.status]} • {property.propertyType}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold truncate text-white drop-shadow-md">
                      {property.title}
                    </h2>
                  </div>
                </div>

                {/* Right Side Thumbnails Strip (Desktop) */}
                <div className="hidden lg:flex flex-col gap-3 h-[520px]">
                  {property.images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedImage(i);
                        setIsLightboxOpen(true);
                      }}

                      className={`relative flex-1 rounded-2xl overflow-hidden border-2 transition-all group ${selectedImage === i

                      className={`relative flex-1 rounded-2xl overflow-hidden border-2 transition-all group ${
                        selectedImage === i

                          ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg"
                          : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt={`View ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {i === 3 && property.images.length > 4 && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm">
                          +{property.images.length - 4} More
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Horizontal Thumbnails (Mobile & Tablet) */}
              <div className="flex lg:hidden gap-2 overflow-x-auto py-1 scrollbar-none">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}

                    className={`relative w-24 h-18 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${selectedImage === i
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-transparent opacity-60"
                      }`}

                    className={`relative w-24 h-18 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === i
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-transparent opacity-60"
                    }`}

                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt={`View ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[350px] sm:h-[480px] rounded-3xl bg-gradient-to-br from-muted via-card to-muted/50 flex flex-col items-center justify-center border border-border">
              <Building2 className="w-20 h-20 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No photos available</p>
            </div>
          )}
        </motion.div>

        {/* Fullscreen Lightbox Modal Overlay */}
        <AnimatePresence>
          {isLightboxOpen && property.images && property.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between text-white z-10">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
                    {selectedImage + 1} / {property.images.length}
                  </span>
                  <span className="text-sm text-gray-300 hidden sm:inline truncate max-w-md">
                    {property.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full w-10 h-10"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Main Lightbox Display */}
              <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  src={resolveImageUrl(property.images[selectedImage])}
                  alt={property.title}
                  className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
                />

                <button
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Bottom Thumbnails Navigation Strip */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}

                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${selectedImage === i
                        ? "border-emerald-500 scale-105 ring-2 ring-emerald-500/50"
                        : "border-transparent opacity-40 hover:opacity-100"
                      }`}

                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === i
                        ? "border-emerald-500 scale-105 ring-2 ring-emerald-500/50"
                        : "border-transparent opacity-40 hover:opacity-100"
                    }`}

                  >
                    <img
                      src={resolveImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Property Details Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    {property.propertyCode && (
                      <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0 rounded-full font-mono text-xs">
                        {property.propertyCode}
                      </Badge>
                    )}
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 rounded-full">
                      {statusLabels[property.status]}
                    </Badge>
                    <Badge variant="outline" className="rounded-full capitalize">
                      {property.propertyType}
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {property.address}, {property.city}, {property.state}{" "}
                      {property.zipCode}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {formatPrice(property.price)}
                </span>
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: BedDouble,
                  label: "Bedrooms",
                  value: property.bedrooms,
                },
                {
                  icon: Bath,
                  label: "Bathrooms",
                  value: property.bathrooms,
                },
                {
                  icon: Maximize,
                  label: "Area",
                  value: `${property.area.toLocaleString()} ft²`,
                },
                {
                  icon: Calendar,
                  label: "Year Built",
                  value: property.yearBuilt,
                },
              ].map((detail) => (
                <Card key={detail.label} className="border-border/50">
                  <CardContent className="p-4 text-center">
                    <detail.icon className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold">{detail.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {detail.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">About This Property</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            <Separator />

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Features & Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Contact & Inquiry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Direct Contact Card */}
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5">
                <h3 className="font-semibold text-white text-lg">Get In Touch</h3>
                <p className="text-emerald-100 text-sm mt-1">
                  Interested in this property? Reach out directly or send us an inquiry below.
                </p>
              </div>
              <CardContent className="p-5 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12 text-base"
                  asChild
                >
                  <a href={`tel:${property.agent?.phone || "+1 (555) 000-0000"}`}>
                    <Phone className="w-5 h-5 mr-3 text-emerald-500" />
                    Call Now
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12 text-base"
                  asChild
                >
                  <a href={`mailto:${property.agent?.email || "info@luxeestates.com"}?subject=Inquiry: ${encodeURIComponent(property.title)}`}>
                    <Mail className="w-5 h-5 mr-3 text-emerald-500" />
                    Send Email
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Schedule Visit Card */}
            <Card className="border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-5">
                <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" />
                  Schedule a Visit
                </h3>
                <p className="text-teal-100 text-sm mt-1">
                  Select an available time slot to visit this property in person.
                </p>
              </div>
              <CardContent className="p-5">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No visit slots are currently available for this property.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Group slots by date */}
                    {Object.entries(
                      timeSlots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
                        (acc[slot.slotDate] = acc[slot.slotDate] || []).push(slot);
                        return acc;
                      }, {})
                    ).map(([date, slots]) => (
                      <div key={date}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {new Date(date + "T00:00:00").toLocaleDateString("en", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedSlot === slot.id
                                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30"
                                  : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-foreground"
                                }`}
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              {slot.startTime} – {slot.endTime}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {bookingSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        Visit booked! Check your dashboard for status updates.
                      </div>
                    ) : (
                      <>
                        {bookingError && (
                          <p className="text-sm text-red-500">{bookingError}</p>
                        )}
                        <Button
                          onClick={handleBookVisit}
                          disabled={!selectedSlot || booking}
                          className="w-full rounded-xl h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                        >
                          {booking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {selectedSlot ? "Book Selected Slot" : "Select a time slot above"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inquiry Form */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-1">Send an Inquiry</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fill out the form below and we&apos;ll get back to you shortly.
                </p>
                <ContactForm propertyId={property.id} compact />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
