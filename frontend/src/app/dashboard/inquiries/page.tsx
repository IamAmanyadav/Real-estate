"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MessageSquare,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBuyerInquiries } from "@/lib/buyer-api";
import { formatPrice, formatDate } from "@/lib/utils";
import type { BuyerInquiry, TrackingStatus } from "@/types";

const TRACKING_CONFIG: Record<
  TrackingStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: Clock },
  under_review: { label: "Under Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Eye },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
  completed: { label: "Completed", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: CheckCircle2 },
};

function TrackingBadge({ status }: { status: TrackingStatus }) {
  const config = TRACKING_CONFIG[status] || TRACKING_CONFIG.submitted;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function BuyerInquiriesPage() {
  const [inquiries, setInquiries] = useState<BuyerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (typeFilter) params.inquiryType = typeFilter;
      if (statusFilter) params.trackingStatus = statusFilter;
      const data = await getBuyerInquiries(params as Parameters<typeof getBuyerInquiries>[0]);
      setInquiries(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          My Inquiries
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your property inquiries and purchase requests ({total} total)
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-4">
        {/* Type Filter */}
        <div className="flex gap-2">
          {[
            { label: "All Types", value: "" },
            { label: "Inquiries", value: "inquiry" },
            { label: "Purchase Requests", value: "purchase_request" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === f.value
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {[
            { label: "All Status", value: "" },
            { label: "Submitted", value: "submitted" },
            { label: "Under Review", value: "under_review" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Completed", value: "completed" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Inquiry List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : inquiries.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Mail className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No inquiries found</h3>
          <p className="text-muted-foreground text-sm">
            {typeFilter || statusFilter
              ? "Try changing your filters."
              : "Browse properties and submit inquiries to get started."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq, i) => (
            <motion.div
              key={inq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md border-border/50 ${
                  expandedId === inq.id ? "ring-2 ring-blue-500/20" : ""
                }`}
                onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Property Image */}
                    {inq.propertyImage && (
                      <div className="relative w-full sm:w-24 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={inq.propertyImage} alt="" fill className="object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {inq.inquiryType === "purchase_request" ? (
                              <ShoppingCart className="w-4 h-4 text-purple-500" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {inq.inquiryType === "purchase_request" ? "Purchase Request" : "Inquiry"}
                            </span>
                          </div>
                          <h3 className="font-semibold leading-tight">
                            {inq.propertyTitle || "General Inquiry"}
                          </h3>
                          {inq.propertyPrice && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              {formatPrice(inq.propertyPrice)}
                            </p>
                          )}
                        </div>
                        <TrackingBadge status={inq.trackingStatus} />
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{inq.message}</p>

                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>Submitted {formatDate(inq.createdAt)}</span>
                        {inq.adminResponse && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Admin responded ✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded — Admin Response */}
                  {expandedId === inq.id && inq.adminResponse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-border/50"
                    >
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Admin Response</p>
                        <p className="text-sm">{inq.adminResponse}</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
