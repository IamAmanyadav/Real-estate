"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSellerProperty, uploadPropertyImages } from "@/lib/seller-api";
import Link from "next/link";

const PROPERTY_TYPES = [
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Condo", value: "condo" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Villa", value: "villa" },
  { label: "Flat", value: "flat" },
  { label: "Plot", value: "plot" },
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
  bedrooms: string;
  bathrooms: string;
  area: string;
  propertyType: string;
  status: string;
  yearBuilt: string;
  images: string[];   // server URLs returned after upload
  features: string[];
  documents: { documentType: string; documentUrl: string; documentName: string }[];
}

interface ImagePreview {
  file: File;
  previewUrl: string;
  serverUrl: string | null;  // null until upload completes
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

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    bedrooms: "",
    bathrooms: "",
    area: "",
    propertyType: "house",
    status: "for_sale",
    yearBuilt: "",
    images: [],
    features: [],
    documents: [],
  });

  const updateField = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    // Create previews
    const newPreviews: ImagePreview[] = fileArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      serverUrl: null,
      uploading: true,
      error: null,
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Upload to server
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
      // Update form images with server URLs
      updateField("images", [
        ...form.images,
        ...result.urls,
      ]);
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
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        address: form.address,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: form.country,
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        area: parseInt(form.area),
        propertyType: form.propertyType,
        status: form.status,
        yearBuilt: parseInt(form.yearBuilt),
        images: form.images,
        features: form.features,
        documents: form.documents.filter((d) => d.documentUrl && d.documentName),
      };

      await createSellerProperty(payload);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/listings"), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create property. Check your inputs.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plus className="w-6 h-6 text-emerald-500" />
          Add New Property
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details below. Your listing will be reviewed by an admin before going live.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" /> Basic Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input id="title" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Modern 3-Bedroom Villa in Beverly Hills" required className="mt-1.5 rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe your property in detail..." rows={4} required className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <select id="propertyType" value={form.propertyType} onChange={(e) => updateField("propertyType", e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Listing Status *</Label>
                  <select id="status" value={form.status} onChange={(e) => updateField("status", e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="for_sale">For Sale</option>
                    <option value="for_rent">For Rent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="yearBuilt">Year Built *</Label>
                  <Input id="yearBuilt" type="number" value={form.yearBuilt} onChange={(e) => updateField("yearBuilt", e.target.value)} placeholder="2020" required min={1800} max={2030} className="mt-1.5 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" /> Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="123 Main Street" required className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Los Angeles" required className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="California" required className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input id="zipCode" value={form.zipCode} onChange={(e) => updateField("zipCode", e.target.value)} placeholder="90210" required className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={(e) => updateField("country", e.target.value)} className="mt-1.5 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pricing & Specifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" /> Pricing & Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input id="price" type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="500000" required min={1} className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="bedrooms" className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> Bedrooms *</Label>
                  <Input id="bedrooms" type="number" value={form.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} placeholder="3" required min={0} className="mt-1.5 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="bathrooms" className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> Bathrooms *</Label>
                  <Input id="bathrooms" type="number" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} placeholder="2" required min={0} className="mt-1.5 rounded-lg" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="area" className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> Area (sqft) *</Label>
                  <Input id="area" type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} placeholder="2000" required min={1} className="mt-1.5 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Images */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-500" /> Property Images
              </h2>
              <p className="text-sm text-muted-foreground">Upload images from your device. Supported formats: JPEG, PNG, WebP, GIF (max 5 MB each).</p>

              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-accent/30"
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
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium">
                    {isDragging ? "Drop images here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF up to 5 MB</p>
                </div>
              </div>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-muted">
                      <img
                        src={preview.previewUrl}
                        alt={`Property ${i + 1}`}
                        className={`w-full h-full object-cover transition-opacity ${
                          preview.uploading ? "opacity-50" : ""
                        }`}
                      />
                      {preview.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {preview.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <span className="text-xs text-red-600 font-medium bg-white/90 px-2 py-1 rounded">{preview.error}</span>
                        </div>
                      )}
                      {preview.serverUrl && (
                        <div className="absolute top-1.5 left-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 drop-shadow" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Features / Amenities */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tags className="w-5 h-5 text-orange-500" /> Features & Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {COMMON_FEATURES.map((feature) => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      form.features.includes(feature)
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-transparent border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add custom feature..."
                  className="rounded-lg"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())}
                />
                <Button type="button" variant="outline" onClick={addCustomFeature} className="rounded-lg shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-500" /> Ownership Documents
              </h2>
              <p className="text-sm text-muted-foreground">Add documents to verify your property ownership (optional but speeds up approval).</p>
              {form.documents.map((doc, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Document #{i + 1}</span>
                    <button type="button" onClick={() => removeDocument(i)} className="text-red-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Type</Label>
                      <select
                        value={doc.documentType}
                        onChange={(e) => updateDocument(i, "documentType", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        {DOCUMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input value={doc.documentName} onChange={(e) => updateDocument(i, "documentName", e.target.value)} placeholder="Title Deed.pdf" className="mt-1 rounded-lg" />
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input value={doc.documentUrl} onChange={(e) => updateDocument(i, "documentUrl", e.target.value)} placeholder="https://..." className="mt-1 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addDocument} className="rounded-lg">
                <Plus className="w-4 h-4 mr-2" /> Add Document
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" asChild className="rounded-xl">
            <Link href="/dashboard/listings">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 px-8"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
