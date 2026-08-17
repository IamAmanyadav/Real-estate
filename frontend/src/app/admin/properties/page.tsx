"use client";

import { useQuery } from "@tanstack/react-query";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Building2, Trash2, CheckCircle, XCircle, Filter,
  MoreHorizontal, Tag, RotateCcw, Archive, Eye, Gavel,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getAdminProperties, updatePropertyVerification, deleteAdminProperty,
} from "@/lib/admin-api";
import type { AdminProperty, PaginatedResponse } from "@/types/admin";
import { useDebounce } from "@/hooks/useDebounce";

const vColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  under_review: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  published: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  sold: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  archived: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

/* ── Action config per status ─────────────────────────────────────────────── */
interface ActionDef {
  label: string;
  targetStatus: string;
  icon: React.ElementType;
  color: string;
  confirm?: string;
}

const actionsForStatus: Record<string, ActionDef[]> = {
  pending: [
    { label: "Approve", targetStatus: "approved", icon: CheckCircle, color: "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" },
    { label: "Reject", targetStatus: "rejected", icon: XCircle, color: "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-500/10", confirm: "Reject this property?" },
  ],
  under_review: [
    { label: "Approve", targetStatus: "approved", icon: CheckCircle, color: "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" },
    { label: "Reject", targetStatus: "rejected", icon: XCircle, color: "text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-500/10", confirm: "Reject this property?" },
  ],
  approved: [
    { label: "Publish", targetStatus: "published", icon: Eye, color: "text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-500/10" },
    { label: "Archive", targetStatus: "archived", icon: Archive, color: "text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500/10", confirm: "Archive this property?" },
  ],
  published: [
    { label: "Mark Sold", targetStatus: "sold", icon: Gavel, color: "text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10", confirm: "Mark this property as sold?" },
    { label: "Archive", targetStatus: "archived", icon: Archive, color: "text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500/10", confirm: "Archive this property? It will be removed from public listings." },
  ],
  sold: [
    { label: "Re-list", targetStatus: "published", icon: RotateCcw, color: "text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-500/10", confirm: "Re-list this property as available?" },
    { label: "Archive", targetStatus: "archived", icon: Archive, color: "text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500/10" },
  ],
  rejected: [
    { label: "Re-approve", targetStatus: "approved", icon: RotateCcw, color: "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10", confirm: "Re-approve this property?" },
    { label: "Archive", targetStatus: "archived", icon: Archive, color: "text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500/10" },
  ],
  archived: [
    { label: "Restore", targetStatus: "approved", icon: RotateCcw, color: "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10", confirm: "Restore this property to approved status?" },
  ],
};

/* ── Dropdown Action Menu ─────────────────────────────────────────────────── */
function ActionMenu({
  prop,
  onVerify,
  onDelete,
}: {
  prop: AdminProperty;
  onVerify: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions = actionsForStatus[prop.verificationStatus] || [];
  const primaryActions = actions.slice(0, 2);
  const hasOverflow = actions.length > 2;

  return (
    <div className="flex items-center gap-1 shrink-0" ref={ref}>
      {/* Primary inline buttons (first 2) */}
      {primaryActions.map((action) => (
        <Button
          key={action.targetStatus}
          size="sm"
          variant="outline"
          className={`rounded-full text-xs ${action.color}`}
          onClick={() => {
            if (action.confirm && !confirm(action.confirm)) return;
            onVerify(prop.id, action.targetStatus);
          }}
        >
          <action.icon className="w-3 h-3 mr-1" />
          {action.label}
        </Button>
      ))}

      {/* Overflow menu for > 2 actions */}
      {hasOverflow && (
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full w-8 h-8 p-0"
            onClick={() => setOpen(!open)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-10 z-50 min-w-[160px] rounded-xl border bg-popover p-1 shadow-lg"
              >
                {actions.slice(2).map((action) => (
                  <button
                    key={action.targetStatus}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-accent ${action.color.split(" ")[0]}`}
                    onClick={() => {
                      if (action.confirm && !confirm(action.confirm)) return;
                      onVerify(prop.id, action.targetStatus);
                      setOpen(false);
                    }}
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Delete — always visible */}
      <Button
        size="sm"
        variant="ghost"
        className="rounded-full text-destructive hover:bg-red-50 dark:hover:bg-red-500/10"
        onClick={() => onDelete(prop.id)}
        title="Delete property permanently"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function AdminPropertiesPage() {
  const [search, setSearch] = useState("");
  const [vFilter, setVFilter] = useState("all");
  const [tFilter, setTFilter] = useState("all");
  const [page, setPage] = useState(1);
  const dSearch = useDebounce(search, 300);

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["admin-properties", dSearch, vFilter, tFilter, page],
    queryFn: async () => {
      const p: Record<string, string | number> = { page, limit: 10 };
      if (dSearch) p.search = dSearch;
      if (vFilter !== "all") p.verificationStatus = vFilter;
      if (tFilter !== "all") p.propertyType = tFilter;
      return getAdminProperties(p);
    },
    staleTime: 60 * 1000,
  });

  const verify = async (id: string, s: string) => {
    try { await updatePropertyVerification(id, s); refetch(); }
    catch (e) { console.error(e); }
  };
  const remove = async (id: string) => {
    if (!confirm("Permanently delete this property? This action cannot be undone.")) return;
    try { await deleteAdminProperty(id); refetch(); }
    catch (e) { console.error(e); }
  };
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${+(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${+(n / 100000).toFixed(2)} Lac`;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Property Management</h1>
        <p className="text-muted-foreground text-sm">
          Review, approve, and manage all property listings
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search properties..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 rounded-xl" />
        </div>
        <Select value={vFilter} onValueChange={(v) => { setVFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <Filter className="w-3 h-3 mr-2" /><SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tFilter} onValueChange={(v) => { setTFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-[150px] rounded-xl">
            <Building2 className="w-3 h-3 mr-2" /><SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {Object.entries(vColors).map(([status, cls]) => (
          <Badge key={status} variant="outline" className={`${cls} capitalize`}>
            {status.replace("_", " ")}
          </Badge>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card border animate-pulse" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((prop, i) => (
            <motion.div key={prop.id} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {(() => {
                      let images = prop.images;
                      if (typeof images === "string") {
                        try {
                          images = JSON.parse(images);
                        } catch (e) {}
                      }
                      const firstImg = Array.isArray(images) && images.length > 0 ? images[0] : null;
                      const dummyImage = "/images/property-fallback.jpg";
                      
                      return firstImg ? (
                        <img
                          src={firstImg.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${firstImg}` : firstImg}
                          alt={prop.title}
                          className="w-20 h-16 rounded-lg object-cover shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = dummyImage;
                          }}
                        />
                      ) : (
                        <img
                          src={dummyImage}
                          alt="Dummy property"
                          className="w-20 h-16 rounded-lg object-cover shrink-0"
                        />
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {prop.propertyCode && (
                          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {prop.propertyCode}
                          </span>
                        )}
                        <h3 className="font-semibold truncate">{prop.title}</h3>
                        <Badge variant="outline"
                          className={vColors[prop.verificationStatus] || ""}>
                          {prop.verificationStatus.replace("_", " ")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {prop.propertyType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {prop.city}, {prop.state} • {fmt(prop.price)}
                      </p>
                    </div>
                    <ActionMenu prop={prop} onVerify={verify} onDelete={remove} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No properties found</p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setPage(page - 1)} className="rounded-full">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)} className="rounded-full">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

