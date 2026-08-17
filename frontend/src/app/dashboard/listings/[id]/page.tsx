"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Save,
  Loader2,
  FileText,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSellerProperty, updateSellerProperty } from "@/lib/seller-api";
import { formatPrice, formatDate, getImageUrl, parseImages } from "@/lib/utils";
import type { SellerProperty, VerificationStatus } from "@/types";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending Review", color: "text-amber-500", icon: Clock },
  under_review: { label: "Under Review", color: "text-blue-500", icon: Eye },
  approved: { label: "Approved", color: "text-emerald-500", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-500", icon: XCircle },
  published: { label: "Published", color: "text-emerald-500", icon: CheckCircle2 },
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit") === "true";

  const [property, setProperty] = useState<SellerProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");

  const fetchProperty = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSellerProperty(id);
      setProperty(data);
      setTitle(data.title);
      setDescription(data.description);
      setPrice(data.price.toString());
      setAddress(data.address);
      setCity(data.city);
      setState(data.state);
      setZipCode(data.zipCode);
      setBedrooms(data.bedrooms.toString());
      setBathrooms(data.bathrooms.toString());
      setArea(data.area.toString());
    } catch {
      setError("Property not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const canEdit = property && (property.verificationStatus === "pending" || property.verificationStatus === "rejected");

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    setError("");
    try {
      await updateSellerProperty(property.id, {
        title,
        description,
        price: parseFloat(price),
        address,
        city,
        state,
        zipCode,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseInt(area),
      });
      setEditing(false);
      fetchProperty();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Property Not Found</h3>
        <Button asChild className="rounded-xl mt-4">
          <Link href="/dashboard/listings">Back to Listings</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[property.verificationStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" asChild className="mb-4 -ml-2 rounded-lg">
          <Link href="/dashboard/listings"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Listings</Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1.5 text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" /> {statusConfig.label}
              </span>
              <span className="text-xs text-muted-foreground">• {property.propertyId}</span>
            </div>
            <h1 className="text-2xl font-bold">{editing ? "Edit Property" : property.title}</h1>
          </div>
          {canEdit && !editing && (
            <Button onClick={() => setEditing(true)} className="rounded-xl">
              <Edit3 className="w-4 h-4 mr-2" /> Edit Property
            </Button>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
      )}

      {/* Rejection Reason */}
      {property.rejectionReason && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason</p>
              <p className="text-sm text-muted-foreground mt-1">{property.rejectionReason}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Images */}
      {parseImages(property.images).length > 0 && !editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {parseImages(property.images).map((url, i) => (
              <div key={i} className={`relative rounded-xl overflow-hidden ${i === 0 ? "col-span-2 row-span-2 aspect-[16/10]" : "aspect-video"}`}>
              <Image src={getImageUrl(url) || ""} alt={`${property.title} ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Details — View or Edit */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50">
          <CardContent className="p-6">
            {editing ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-3">Edit Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>Price (₹)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>ZIP Code</Label>
                    <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>Bedrooms</Label>
                    <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                  <div>
                    <Label>Area (sqft)</Label>
                    <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="mt-1.5 rounded-lg" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl px-6">
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Property Details</h2>
                  <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Bed className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{property.bedrooms}</p>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Bath className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{property.bathrooms}</p>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Maximize className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{property.area.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sq Ft</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{property.yearBuilt}</p>
                    <p className="text-xs text-muted-foreground">Year Built</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p>{property.address}, {property.city}, {property.state} {property.zipCode}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price</h3>
                    <p className="text-2xl font-bold text-emerald-600">{formatPrice(property.price)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{property.status.replace("_", " ")}</p>
                  </div>
                </div>

                {/* Features */}
                {property.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Features & Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((f) => (
                        <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {property.documents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</h3>
                    <div className="space-y-2">
                      {property.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-cyan-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.documentName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{doc.documentType.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              doc.status === "verified"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : doc.status === "rejected"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}>
                              {doc.status}
                            </span>
                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-4 border-t border-border/50">
                  Created {formatDate(property.createdAt)} · Last updated {formatDate(property.updatedAt)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
