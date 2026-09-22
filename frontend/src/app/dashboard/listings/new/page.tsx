"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  IndianRupee,
  Bed,
  Bath,
  Maximize,
  Calendar,
  ImageIcon,
  FileText,
  Tags,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Gavel,
  Zap,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createSellerProperty, uploadPropertyImages } from "@/lib/seller-api";
import Link from "next/link";
import MapboxLocationPicker from "@/components/properties/MapboxLocationPicker";

const PROPERTY_TYPES = [
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Condo", value: "condo" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Villa", value: "villa" },
  { label: "Flat", value: "flat" },
  { label: "Ground / Plot", value: "plot" },
];

const DOCUMENT_TYPES = [
  { label: "Title Deed", value: "title_deed" },
  { label: "Ownership Certificate", value: "ownership_certificate" },
  { label: "Tax Receipt", value: "tax_receipt" },
  { label: "Identity Proof", value: "identity_proof" },
  { label: "NOC", value: "noc" },
  { label: "Encumbrance Certificate", value: "encumbrance_certificate" },
  { label: "Other", value: "other" },
];

const COMMON_FEATURES = [
  "Swimming Pool", "Gym", "Parking", "Garden", "Security",
  "Elevator", "Balcony", "Air Conditioning", "Fireplace",
  "Laundry", "Storage", "Pet Friendly", "Smart Home",
  "Solar Panels", "Home Theater", "Wine Cellar",
];

interface FormData {
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: string;
  bathrooms: string;
  area: string;
  propertyType: string;
  status: string;
  yearBuilt: string;
  images: string[];
  features: string[];
  documents: { documentType: string; documentUrl: string; documentName: string }[];
  isAuction: boolean;
  reservePrice: string;
  auctionEndDate: string;
  minBidIncrement: string;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
  serverUrl: string | null;
  uploading: boolean;
  error: string | null;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    latitude: null,
    longitude: null,
    bedrooms: "",
    bathrooms: "",
    area: "",
    propertyType: "house",
    status: "for_sale",
    yearBuilt: "",
    images: [],
    features: [],
    documents: [],
    isAuction: true,
    reservePrice: "",
    auctionEndDate: "",
    minBidIncrement: "1000",
  });

  const updateField = (field: keyof FormData, value: unknown) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value, isAuction: true };
      if (field === "propertyType") {
        if (value === "plot" || value === "ground") {
          if (!next.bedrooms) next.bedrooms = "0";
          if (!next.bathrooms) next.bathrooms = "0";
          if (!next.reservePrice && next.price) next.reservePrice = next.price;
        }
      }
      if (field === "price" && !next.reservePrice) {
        next.reservePrice = value as string;
      }
      return next;
    });
  };

  const isPlotOrGround = form.propertyType === "plot" || form.propertyType === "ground";

  // Validation Logic
  const validationIssues = useMemo(() => {
    const issues: { field: string; label: string; message: string; section: string; elementId: string }[] = [];

    // Basic Details
    if (!form.title.trim()) {
      issues.push({ field: "title", label: "Property Title", message: "Property Title is required", section: "Basic Details", elementId: "title" });
    } else if (form.title.trim().length < 5) {
      issues.push({ field: "title", label: "Property Title", message: "Title must be at least 5 characters", section: "Basic Details", elementId: "title" });
    }

    if (!form.description.trim()) {
      issues.push({ field: "description", label: "Description", message: "Description is required", section: "Basic Details", elementId: "description" });
    } else if (form.description.trim().length < 30) {
      issues.push({
        field: "description",
        label: "Description",
        message: `Your description is too short (currently ${form.description.trim().length}/30 characters minimum). Please add more details about property features, rooms, and location.`,
        section: "Basic Details",
        elementId: "description",
      });
    }

    if (!form.yearBuilt) {
      issues.push({ field: "yearBuilt", label: "Year Built", message: "Year Built is required", section: "Basic Details", elementId: "yearBuilt" });
    } else {
      const year = parseInt(form.yearBuilt);
      if (isNaN(year) || year < 1800 || year > 2035) {
        issues.push({ field: "yearBuilt", label: "Year Built", message: "Year Built must be between 1800 and 2035", section: "Basic Details", elementId: "yearBuilt" });
      }
    }

    // Location
    if (!form.address.trim()) {
      issues.push({ field: "address", label: "Street Address", message: "Street Address is required", section: "Location", elementId: "address" });
    }
    if (!form.city.trim()) {
      issues.push({ field: "city", label: "City", message: "City is required", section: "Location", elementId: "city" });
    }
    if (!form.state.trim()) {
      issues.push({ field: "state", label: "State", message: "State is required", section: "Location", elementId: "state" });
    }
    if (!form.zipCode.trim()) {
      issues.push({ field: "zipCode", label: "ZIP Code", message: "ZIP Code is required", section: "Location", elementId: "zipCode" });
    }

    // Pricing & Specs
    if (!form.price) {
      issues.push({ field: "price", label: "Listing Price", message: "Price is required", section: "Pricing & Specs", elementId: "price" });
    } else if (parseFloat(form.price) <= 0 || isNaN(parseFloat(form.price))) {
      issues.push({ field: "price", label: "Listing Price", message: "Price must be greater than ₹0", section: "Pricing & Specs", elementId: "price" });
    }

    if (!isPlotOrGround) {
      if (form.bedrooms === "" || form.bedrooms === null) {
        issues.push({ field: "bedrooms", label: "Bedrooms", message: "Number of Bedrooms is required", section: "Pricing & Specs", elementId: "bedrooms" });
      } else if (parseInt(form.bedrooms) < 0) {
        issues.push({ field: "bedrooms", label: "Bedrooms", message: "Bedrooms cannot be negative", section: "Pricing & Specs", elementId: "bedrooms" });
      }

      if (form.bathrooms === "" || form.bathrooms === null) {
        issues.push({ field: "bathrooms", label: "Bathrooms", message: "Number of Bathrooms is required", section: "Pricing & Specs", elementId: "bathrooms" });
      } else if (parseFloat(form.bathrooms) < 0) {
        issues.push({ field: "bathrooms", label: "Bathrooms", message: "Bathrooms cannot be negative", section: "Pricing & Specs", elementId: "bathrooms" });
      }
    }

    if (!form.area) {
      issues.push({ field: "area", label: "Area", message: "Property Area (sqft) is required", section: "Pricing & Specs", elementId: "area" });
    } else if (parseInt(form.area) <= 0) {
      issues.push({ field: "area", label: "Area", message: "Area must be greater than 0 sqft", section: "Pricing & Specs", elementId: "area" });
    }

    // Mandatory Auction Mode
    if (!form.reservePrice) {
      issues.push({ field: "reservePrice", label: "Reserve Price", message: "Lowest Acceptable Bid (Reserve Price) is required", section: "Auction Mode", elementId: "reservePrice" });
    } else if (parseFloat(form.reservePrice) <= 0) {
      issues.push({ field: "reservePrice", label: "Reserve Price", message: "Reserve Price must be greater than ₹0", section: "Auction Mode", elementId: "reservePrice" });
    }

    return issues;
  }, [form, isPlotOrGround]);

  // Total required fields count and completed count
  const totalRequiredCount = isPlotOrGround ? 10 : 12;
  const completedCount = totalRequiredCount - validationIssues.length;
  const progressPercent = Math.round((completedCount / totalRequiredCount) * 100);

  const getFieldError = (fieldName: string) => {
    return validationIssues.find((issue) => issue.field === fieldName)?.message || null;
  };

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    const newPreviews: ImagePreview[] = fileArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      serverUrl: null,
      uploading: true,
      error: null,
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);

    try {
      const result = await uploadPropertyImages(fileArray);
      setImagePreviews((prev) =>
        prev.map((p) => {
          const idx = newPreviews.findIndex((np) => np.file === p.file);
          if (idx !== -1 && result.urls[idx]) {
            return { ...p, serverUrl: result.urls[idx], uploading: false };
          }
          return p;
        })
      );
      updateField("images", [...form.images, ...result.urls]);
    } catch {
      setImagePreviews((prev) =>
        prev.map((p) => {
          if (newPreviews.some((np) => np.file === p.file)) {
            return { ...p, uploading: false, error: "Upload failed" };
          }
          return p;
        })
      );
    }
  };

  const removeImage = (index: number) => {
    const preview = imagePreviews[index];
    if (preview) {
      URL.revokeObjectURL(preview.previewUrl);
      const serverUrl = preview.serverUrl;
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
      if (serverUrl) {
        updateField("images", form.images.filter((u) => u !== serverUrl));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleFeature = (feature: string) => {
    if (form.features.includes(feature)) {
      updateField("features", form.features.filter((f) => f !== feature));
    } else {
      updateField("features", [...form.features, feature]);
    }
  };

  const addCustomFeature = () => {
    const f = newFeature.trim();
    if (f && !form.features.includes(f)) {
      updateField("features", [...form.features, f]);
      setNewFeature("");
    }
  };

  const addDocument = () => {
    updateField("documents", [
      ...form.documents,
      { documentType: "title_deed", documentUrl: "", documentName: "" },
    ]);
  };

  const updateDocument = (index: number, field: string, value: string) => {
    const docs = [...form.documents];
    docs[index] = { ...docs[index], [field]: value };
    updateField("documents", docs);
  };

  const removeDocument = (index: number) => {
    updateField("documents", form.documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setError("");

    if (validationIssues.length > 0) {
      const firstIssue = validationIssues[0];
      scrollToElement(firstIssue.elementId);
      setError(`Please complete all required fields. You still have ${validationIssues.length} items left to fill.`);
      return;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        country: form.country.trim() || "India",
        latitude: form.latitude,
        longitude: form.longitude,
        bedrooms: isPlotOrGround ? 0 : (parseInt(form.bedrooms) || 0),
        bathrooms: isPlotOrGround ? 0 : (parseInt(form.bathrooms) || 0),
        area: parseInt(form.area) || 0,
        propertyType: form.propertyType,
        status: form.status,
        yearBuilt: parseInt(form.yearBuilt) || new Date().getFullYear(),
        images: form.images,
        features: form.features,
        documents: form.documents
          .filter((d) => d.documentUrl && d.documentName && d.documentUrl.trim().length >= 5)
          .map((d) => ({
            documentType: d.documentType || "title_deed",
            documentUrl: d.documentUrl.trim(),
            documentName: d.documentName.trim(),
          })),
        isAuction: true,
        reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : (parseFloat(form.price) || 0),
        auctionEndDate: form.auctionEndDate ? new Date(form.auctionEndDate).toISOString() : null,
        minBidIncrement: form.minBidIncrement ? parseFloat(form.minBidIncrement) : 1000.0,
      };

      await createSellerProperty(payload);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/listings"), 2000);
    } catch (err: unknown) {
      console.error("Property creation error:", err);
      let msg = "Failed to create property. Check your inputs.";
      const errObj = err as {
        response?: { data?: { detail?: unknown; message?: string } };
        message?: string;
      };
      if (errObj?.response?.data?.detail) {
        const detail = errObj.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail
            .map((d: { msg?: string; loc?: string[] }) => {
              const field = d.loc ? d.loc.slice(1).join(".") : "";
              return `${field ? field + ": " : ""}${d.msg || "Invalid input"}`;
            })
            .join(" | ");
        } else {
          msg = JSON.stringify(detail);
        }
      } else if (errObj?.response?.data?.message) {
        msg = errObj.response.data.message;
      } else if (errObj?.message === "Network Error") {
        msg = "Network Error: Unable to reach the backend API. Please verify that the backend server is running on http://localhost:8000.";
      } else if (errObj?.message) {
        msg = errObj.message;
      }
      setError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Property Submitted!</h2>
        <p className="text-muted-foreground mb-6">
          Your property has been submitted for review. You&apos;ll be notified once it&apos;s approved.
        </p>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/listings">View My Listings</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" asChild className="mb-4 -ml-2 rounded-lg">
          <Link href="/dashboard/listings">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Listings
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-500" />
              Add New Property
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Provide complete information below to list your property. Required fields are marked with an asterisk (*).
            </p>
          </div>

          {/* Progress Pill */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-card border border-border/80 shadow-xs shrink-0">
            <div className="text-right">
              <div className="text-xs font-bold text-foreground">
                {completedCount} of {totalRequiredCount} Required Filled
              </div>
              <div className="text-[11px] text-muted-foreground">
                {validationIssues.length === 0 ? "Ready to submit!" : `${validationIssues.length} left to complete`}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
              {progressPercent}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Missing Required Fields Alert Box */}
      <AnimatePresence>
        {hasAttemptedSubmit && validationIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-300 space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>Please complete the following {validationIssues.length} required items to submit your property:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {validationIssues.map((issue, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToElement(issue.elementId)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-background/80 hover:bg-background border border-red-500/20 text-left transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1">
                    {issue.label}:
                  </span>
                  <span className="text-muted-foreground line-clamp-1 text-[11px] flex-1">
                    {issue.message}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 1. Basic Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" /> Basic Details
                </h2>
                <span className="text-xs text-muted-foreground">Core property identification</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Property Title */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="title" className="font-semibold">
                    Property Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                    className={`rounded-xl h-11 transition-all ${hasAttemptedSubmit && getFieldError("title")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("title") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("title")}
                    </p>
                  )}
                </div>

                {/* Description with Length Warning */}
                <div className="md:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-semibold">
                      Property Description <span className="text-red-500">*</span>
                    </Label>
                    <span className={`text-xs font-mono font-medium ${form.description.trim().length >= 30
                        ? "text-emerald-500"
                        : form.description.trim().length > 0
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}>
                      {form.description.trim().length} / 30 min chars
                    </span>
                  </div>

                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    required
                    className={`rounded-xl transition-all ${(hasAttemptedSubmit && getFieldError("description")) ||
                        (form.description.length > 0 && form.description.trim().length < 30)
                        ? "border-amber-500 ring-1 ring-amber-500/30"
                        : form.description.trim().length >= 30
                          ? "border-emerald-500/60"
                          : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />

                  {/* Real-time Short Description Warning */}
                  {form.description.trim().length > 0 && form.description.trim().length < 30 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2 mt-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        <strong>Your description is too short:</strong> Please provide at least 30 characters describing room layouts, property condition, highlights, and surroundings. ({30 - form.description.trim().length} characters needed)
                      </span>
                    </div>
                  )}

                  {form.description.trim().length >= 30 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Description length looks great ({form.description.trim().length} characters).
                    </p>
                  )}

                  {hasAttemptedSubmit && !form.description.trim() && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Description is required (minimum 30 characters).
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <select id="propertyType" value={form.propertyType} onChange={(e) => updateField("propertyType", e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Listing Status *</Label>
                  <select id="status" value={form.status} onChange={(e) => updateField("status", e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm">
                    <option value="for_sale" className="bg-background text-foreground">For Sale</option>
                    <option value="for_rent" className="bg-background text-foreground">For Rent</option>
                  </select>
                </div>

                {/* Year Built */}
                <div className="space-y-1.5">
                  <Label htmlFor="yearBuilt" className="font-semibold">
                    Year Built <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={form.yearBuilt}
                    onChange={(e) => updateField("yearBuilt", e.target.value)}
                    required
                    min={1800}
                    max={2035}
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("yearBuilt")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("yearBuilt") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("yearBuilt")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Location Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Property Location
                </h2>
                <span className="text-xs text-muted-foreground">Address & geographic area</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Street Address */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="address" className="font-semibold">
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("address")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("address") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("address")}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="font-semibold">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("city")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("city") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("city")}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="font-semibold">
                    State / Province <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    required
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("state")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("state") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("state")}
                    </p>
                  )}
                </div>

                {/* ZIP Code */}
                <div className="space-y-1.5">
                  <Label htmlFor="zipCode" className="font-semibold">
                    ZIP / Postal Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="zipCode"
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    required
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("zipCode")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("zipCode") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("zipCode")}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="font-semibold">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="rounded-xl h-11 border-border/80 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <MapboxLocationPicker
                  initialLatitude={form.latitude}
                  initialLongitude={form.longitude}
                  onChange={(lat, lng) => {
                    updateField("latitude", lat);
                    updateField("longitude", lng);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Pricing & Specs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-green-500" /> Pricing & Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input id="price" type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="5000000" required min={1} className="mt-1.5 rounded-lg" />
                </div>

                {/* Bedrooms */}
                <div className="space-y-1.5">
                  <Label htmlFor="bedrooms" className="font-semibold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-emerald-500" /> Bedrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => updateField("bedrooms", e.target.value)}
                    required
                    min={0}
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("bedrooms")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("bedrooms") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("bedrooms")}
                    </p>
                  )}
                </div>

                {/* Bathrooms */}
                <div className="space-y-1.5">
                  <Label htmlFor="bathrooms" className="font-semibold flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-emerald-500" /> Bathrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={form.bathrooms}
                    onChange={(e) => updateField("bathrooms", e.target.value)}
                    required
                    min={0}
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("bathrooms")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("bathrooms") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("bathrooms")}
                    </p>
                  )}
                </div>

                {/* Area */}
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="area" className="font-semibold flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-emerald-500" /> Property Area (sqft) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    value={form.area}
                    onChange={(e) => updateField("area", e.target.value)}
                    required
                    min={1}
                    className={`rounded-xl h-11 ${hasAttemptedSubmit && getFieldError("area")
                        ? "border-red-500 ring-1 ring-red-500/30"
                        : "border-border/80 focus-visible:ring-emerald-500"
                      }`}
                  />
                  {hasAttemptedSubmit && getFieldError("area") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError("area")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Live Bidding & Auction Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="border-2 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-amber-500" /> Live Dynamic Auction Mode
                    </h2>
                    <Badge className="bg-amber-500 text-slate-950 font-extrabold text-[11px] py-0.5 px-2">
                      Mandatory for All Seller Listings
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All seller properties are sold through transparent live dynamic bidding to guarantee fair and competitive market offers.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-border/50">
                {/* Informational Callout for First Bid Timer Trigger */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">
                      ⏱️ Auction Countdown Starts Automatically on 1st Bid
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      The countdown timer will stay pending and will begin ticking the instant the first buyer places a bid. If any bid is submitted within the final 1 hour of the auction, anti-sniping protection automatically increases the countdown by 1 more day.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reserve Price */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reservePrice" className="font-semibold text-foreground">
                      Lowest Acceptable Bid (Reserve Price) <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Minimum price at which you agree to sell. Bidding starts from here.
                    </p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">₹</span>
                      <Input
                        id="reservePrice"
                        type="number"
                        value={form.reservePrice}
                        onChange={(e) => updateField("reservePrice", e.target.value)}
                        required
                        min={1}
                        className={`pl-8 rounded-xl h-11 font-mono ${hasAttemptedSubmit && getFieldError("reservePrice")
                            ? "border-red-500 ring-1 ring-red-500/30"
                            : "border-border/80 focus-visible:ring-amber-500"
                          }`}
                      />
                    </div>
                    {hasAttemptedSubmit && getFieldError("reservePrice") && (
                      <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {getFieldError("reservePrice")}
                      </p>
                    )}
                  </div>

                  {/* Auction Duration & End Date */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auctionEndDate" className="font-semibold text-foreground">
                        Auction Duration (Starts upon 1st Bid)
                      </Label>
                      <span className="text-[10px] text-amber-500 font-medium">Auto-triggers on 1st bid</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Quick duration presets or pick a custom date & time:
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pb-1">
                      {[
                        { label: "24 Hours", hours: 24 },
                        { label: "48 Hours", hours: 48 },
                        { label: "3 Days", hours: 72 },
                        { label: "7 Days", hours: 168 },
                      ].map((preset) => (
                        <button
                          key={preset.hours}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setHours(d.getHours() + preset.hours);
                            const pad = (n: number) => String(n).padStart(2, "0");
                            const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                            updateField("auctionEndDate", formatted);
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <Input
                      id="auctionEndDate"
                      type="datetime-local"
                      value={form.auctionEndDate}
                      onChange={(e) => updateField("auctionEndDate", e.target.value)}
                      className="rounded-xl h-11 border-border/80 focus-visible:ring-amber-500"
                    />
                  </div>

                  {/* Minimum Bid Jump Increment */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="font-semibold text-foreground flex items-center justify-between">
                      <span>Minimum Bid Jump Increment</span>
                      <span className="text-xs text-amber-500 font-bold">10% Dynamic Rule Active</span>
                    </Label>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        Every subsequent bid is strictly required to be at least <strong>10% higher than the current price</strong> (automatically computed and updated in real time).
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Blind Privacy Protocol:</strong> Bidders are anonymized. When the auction concludes, final contact details are made available to the seller for closing and documentation.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. Images */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" /> Property Images
                </h2>
                <span className="text-xs text-muted-foreground">Max 5 MB each (JPEG, PNG, WebP)</span>
              </div>

              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("image-upload-input")?.click()}
              >
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold">
                    {isDragging ? "Drop images here" : "Click to select or drag and drop images"}
                  </p>
                  <p className="text-xs text-muted-foreground">High quality photos increase buyer interest and quick approval</p>
                </div>
              </div>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-muted border border-border/50">
                      <img
                        src={preview.previewUrl}
                        alt={`Property ${i + 1}`}
                        className={`w-full h-full object-cover transition-opacity ${preview.uploading ? "opacity-50" : ""
                          }`}
                      />
                      {preview.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {preview.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <span className="text-xs text-red-600 font-medium bg-white/90 px-2 py-1 rounded">{preview.error}</span>
                        </div>
                      )}
                      {preview.serverUrl && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. Features & Amenities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Tags className="w-5 h-5 text-orange-500" /> Features & Amenities
                </h2>
                <span className="text-xs text-muted-foreground">Select all that apply</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${form.features.includes(feature)
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-background border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="rounded-xl h-10 border-border/80"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())}
                />
                <Button type="button" variant="outline" onClick={addCustomFeature} className="rounded-xl h-10 px-4 shrink-0 font-semibold">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7. Documents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-500" /> Ownership Documents
                </h2>
                <span className="text-xs text-muted-foreground">Optional (speeds up verification)</span>
              </div>

              {form.documents.map((doc, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Document #{i + 1}</span>
                    <button type="button" onClick={() => removeDocument(i)} className="text-red-500 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Document Type</Label>
                      <select
                        value={doc.documentType}
                        onChange={(e) => updateDocument(i, "documentType", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-sm"
                      >
                        {DOCUMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value} className="bg-background text-foreground">{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Document Name</Label>
                      <Input
                        value={doc.documentName}
                        onChange={(e) => updateDocument(i, "documentName", e.target.value)}
                        className="mt-1 rounded-xl h-10 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Document URL / Link</Label>
                      <Input
                        value={doc.documentUrl}
                        onChange={(e) => updateDocument(i, "documentUrl", e.target.value)}
                        className="mt-1 rounded-xl h-10 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addDocument} className="rounded-xl h-10 font-semibold text-xs">
                <Plus className="w-4 h-4 mr-2" /> Add Document Link
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Actions Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3 pt-2">
          {validationIssues.length > 0 && hasAttemptedSubmit && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>You have {validationIssues.length} required field{validationIssues.length > 1 ? "s" : ""} left to fill or fix before you can submit.</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => scrollToElement(validationIssues[0].elementId)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline p-0 h-auto"
              >
                Go to first missing field →
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button type="button" variant="outline" asChild className="rounded-xl h-11 px-5 font-semibold">
              <Link href="/dashboard/listings">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 px-8 h-11 font-bold cursor-pointer"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
