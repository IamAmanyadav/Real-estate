"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getSellerProperties, deleteSellerProperty } from "@/lib/seller-api";
import { formatPrice, formatDate, getImageUrl } from "@/lib/utils";
import type { SellerProperty, VerificationStatus } from "@/types";

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "Pending Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Eye },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  sold: { label: "Sold", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: CheckCircle2 },
  archived: { label: "Archived", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", icon: AlertCircle },
};

function StatusBadge({ status }: { status: VerificationStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function MyListingsPage() {
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (filter) params.verificationStatus = filter;
      const data = await getSellerProperties(params as Parameters<typeof getSellerProperties>[0]);
      setProperties(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    setDeleting(id);
    try {
      await deleteSellerProperty(id);
      fetchProperties();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to delete";
      alert(msg);
    } finally {
      setDeleting(null);
    }
  };

  const canEdit = (status: VerificationStatus) =>
    status === "pending" || status === "rejected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            My Listings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your property listings ({total} total)
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
          <Link href="/dashboard/listings/new">
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </Link>
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {[
          { label: "All", value: "" },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
          { label: "Published", value: "published" },
          { label: "Rejected", value: "rejected" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === f.value
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Property List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-muted h-32" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {filter ? "Try changing your filter." : "Start by adding your first property listing."}
          </p>
          {!filter && (
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/listings/new">
                <Plus className="w-4 h-4 mr-2" /> Add Property
              </Link>
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-border/50">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-48 h-40 sm:h-auto relative shrink-0">
                      {prop.images[0] ? (
                        <img
                          src={getImageUrl(prop.images[0]) || ""}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{prop.title}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {prop.address}, {prop.city}, {prop.state}
                            </p>
                          </div>
                          <StatusBadge status={prop.verificationStatus} />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span className="font-bold text-foreground text-lg">{formatPrice(prop.price)}</span>
                          <span className="text-border">|</span>
                          <span>{prop.bedrooms} bed · {prop.bathrooms} bath · {prop.area} sqft</span>
                          <span className="text-border">|</span>
                          <span className="capitalize">{prop.propertyType}</span>
                        </div>

                        {prop.rejectionReason && (
                          <div className="mt-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              <strong>Rejection reason:</strong> {prop.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          ID: {prop.propertyId} · Listed {formatDate(prop.createdAt)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild className="rounded-lg">
                            <Link href={`/dashboard/listings/${prop.id}`}>
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Link>
                          </Button>
                          {canEdit(prop.verificationStatus) && (
                            <>
                              <Button variant="ghost" size="sm" asChild className="rounded-lg text-blue-600 hover:text-blue-700">
                                <Link href={`/dashboard/listings/${prop.id}?edit=true`}>
                                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(prop.id)}
                                disabled={deleting === prop.id}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                {deleting === prop.id ? "..." : "Delete"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
