"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  Clock,
  TrendingUp,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Loader2,
  Search,
  Eye,
  Handshake,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAdminAuctions,
  getAdminAuditHistory,
  setAdminAuctionDecision,
} from "@/lib/bidding-api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import type { AdminAuctionOverviewItem, AdminBidItem } from "@/types";
import Link from "next/link";

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState<AdminAuctionOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Audit modal state
  const [selectedAuction, setSelectedAuction] = useState<AdminAuctionOverviewItem | null>(null);
  const [auditBids, setAuditBids] = useState<AdminBidItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedPropertyIds, setExpandedPropertyIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (propId: string) => {
    setExpandedPropertyIds((prev) => ({
      ...prev,
      [propId]: !prev[propId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    auctions.forEach((a) => {
      next[a.property_id] = true;
    });
    setExpandedPropertyIds(next);
  };

  const collapseAll = () => {
    setExpandedPropertyIds({});
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await getAdminAuctions();
      setAuctions(data);
      // Auto-expand properties that have active bids
      const initialExpanded: Record<string, boolean> = {};
      data.forEach((a) => {
        if (a.total_bids > 0 || (a.bids && a.bids.length > 0)) {
          initialExpanded[a.property_id] = true;
        }
      });
      setExpandedPropertyIds(initialExpanded);
    } catch (err) {
      console.error("Failed to load admin auctions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const openAuditModal = async (auction: AdminAuctionOverviewItem) => {
    setSelectedAuction(auction);
    if (auction.bids && auction.bids.length > 0) {
      setAuditBids(auction.bids);
    }
    try {
      setLoadingAudit(true);
      const history = await getAdminAuditHistory(auction.property_id);
      setAuditBids(history);
    } catch (err) {
      console.error("Failed to load audit history", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleDecision = async (
    propertyId: string,
    status: "accepted" | "rejected" | "offline_completed" | "cancelled"
  ) => {
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      await setAdminAuctionDecision(propertyId, status);
      setFeedbackMsg({
        type: "success",
        text: `Auction updated to ${status.replace("_", " ")} successfully!`,
      });
      await fetchAuctions();
      if (selectedAuction && selectedAuction.property_id === propertyId) {
        setSelectedAuction((prev) => prev ? { ...prev, auction_status: status } : prev);
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Action failed";
      setFeedbackMsg({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAuctions = auctions.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesBids = (a.bids || []).some(
      (b) =>
        b.bidder_name.toLowerCase().includes(q) ||
        b.bidder_email.toLowerCase().includes(q) ||
        (b.bidder_phone && b.bidder_phone.toLowerCase().includes(q))
    );

    const matchesSearch =
      a.title.toLowerCase().includes(q) ||
      (a.property_code && a.property_code.toLowerCase().includes(q)) ||
      (a.seller_name && a.seller_name.toLowerCase().includes(q)) ||
      (a.seller_email && a.seller_email.toLowerCase().includes(q)) ||
      (a.highest_bidder_name && a.highest_bidder_name.toLowerCase().includes(q)) ||
      (a.highest_bidder_email && a.highest_bidder_email.toLowerCase().includes(q)) ||
      (a.highest_bidder_phone && a.highest_bidder_phone.toLowerCase().includes(q)) ||
      matchesBids;

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && a.auction_status === "active";
    if (statusFilter === "ended") return matchesSearch && a.auction_status === "ended";
    if (statusFilter === "accepted") return matchesSearch && a.auction_status === "accepted";
    if (statusFilter === "completed") return matchesSearch && a.auction_status === "offline_completed";
    return matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
            <Gavel className="w-8 h-8 text-amber-500" />
            Auction & Dynamic Bidding Control Room
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Admin oversight: Full visibility into bidder identities, live pricing feeds, and offline settlement decisions.
          </p>
        </div>
        <Button onClick={fetchAuctions} variant="outline" size="sm" className="rounded-xl">
          Refresh Feeds
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Auctions</p>
              <h3 className="text-2xl font-bold text-foreground">{auctions.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Live Active Bidding</p>
              <h3 className="text-2xl font-bold text-foreground">
                {auctions.filter((a) => a.auction_status === "active").length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Decision</p>
              <h3 className="text-2xl font-bold text-foreground">
                {auctions.filter((a) => a.auction_status === "ended").length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Offline Completed</p>
              <h3 className="text-2xl font-bold text-foreground">
                {auctions.filter((a) => a.auction_status === "offline_completed").length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search property, seller, or bidder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 flex-wrap">
          {["all", "active", "ended", "accepted", "completed"].map((tab) => (
            <Button
              key={tab}
              variant={statusFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab)}
              className="rounded-xl text-xs capitalize"
            >
              {tab}
            </Button>
          ))}
          <div className="border-l border-border/60 pl-2 ml-1 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-sm ${
          feedbackMsg.type === "success"
            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
            : "bg-red-950/40 border-red-500/50 text-red-300"
        }`}>
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Auctions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredAuctions.length === 0 ? (
        <Card className="border-border/60 p-12 text-center">
          <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No auctions found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search keywords.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAuctions.map((auction) => {
            const isEnded = auction.auction_status === "ended" || auction.time_remaining_seconds <= 0;
            const isExpanded = !!expandedPropertyIds[auction.property_id];
            const propertyBids = auction.bids || [];

            return (
              <Card
                key={auction.property_id}
                className="overflow-hidden border-border/70 hover:border-amber-500/40 transition-all rounded-2xl bg-card/80 backdrop-blur-sm"
              >
                {/* Main Property Overview Row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Property Photo Thumbnail & Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-muted/60 relative shrink-0 border border-border/60">
                      {auction.property_image ? (
                        <img
                          src={getImageUrl(auction.property_image)}
                          alt={auction.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/property-fallback.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/40">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {auction.property_code && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {auction.property_code}
                          </Badge>
                        )}
                        <Badge className={
                          auction.auction_status === "active"
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : auction.auction_status === "offline_completed"
                            ? "bg-emerald-600 text-white"
                            : auction.auction_status === "accepted"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-white"
                        }>
                          {auction.auction_status ? auction.auction_status.toUpperCase() : "ACTIVE"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {auction.time_remaining_seconds > 0
                            ? `${Math.floor(auction.time_remaining_seconds / 3600)}h ${Math.floor((auction.time_remaining_seconds % 3600) / 60)}m left`
                            : "Deadline Expired"}
                        </span>
                      </div>

                      <Link
                        href={`/properties/${auction.property_id}`}
                        target="_blank"
                        className="text-lg font-bold text-foreground hover:text-amber-500 transition-colors block truncate"
                      >
                        {auction.title}
                      </Link>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
                        <span>Seller: <strong className="text-foreground">{auction.seller_name || "Unknown"}</strong> ({auction.seller_email})</span>
                        <span>Lowest Reserve: <strong className="text-foreground">{formatPrice(auction.reserve_price || 0)}</strong></span>
                        <span>Total Bids: <strong className="text-amber-500 font-bold">{auction.total_bids}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Current Highest Bid & Bidder Full Profile (Admin Exclusive) */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 min-w-[280px] lg:max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Highest Bid Offer</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-amber-500 font-mono">
                      {auction.current_highest_bid
                        ? formatPrice(auction.current_highest_bid)
                        : "No Bids Yet"}
                    </div>

                    {auction.highest_bidder_name ? (
                      <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span>{auction.highest_bidder_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{auction.highest_bidder_email}</span>
                        </div>
                        {auction.highest_bidder_phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{auction.highest_bidder_phone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-1 italic">
                        No active bidder yet.
                      </p>
                    )}
                  </div>

                  {/* Right Column: Admin Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
                    <Button
                      variant={isExpanded ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleExpand(auction.property_id)}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      {isExpanded ? "Hide Bids" : `View Bids (${propertyBids.length || auction.total_bids})`}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAuditModal(auction)}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      Full Modal Audit
                    </Button>

                    {auction.auction_status === "ended" && auction.highest_bidder_name && (
                      <>
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleDecision(auction.property_id, "accepted")}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept Winning Bid
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleDecision(auction.property_id, "rejected")}
                          className="rounded-xl text-xs gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject Bid
                        </Button>
                      </>
                    )}

                    {auction.auction_status === "accepted" && (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleDecision(auction.property_id, "offline_completed")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1"
                      >
                        <Handshake className="w-3.5 h-3.5" /> Confirm Offline Handover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expandable Property-Wise Bids Stream Table (Admin Exclusive) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/70 bg-muted/20 p-4 sm:p-6 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-amber-500" />
                          Property Bids Audit Stream ({propertyBids.length} entries)
                        </h4>
                        <span className="text-[11px] text-muted-foreground">
                          All bidder identities visible to Admin
                        </span>
                      </div>

                      {propertyBids.length === 0 ? (
                        <div className="p-6 text-center rounded-xl bg-card border border-border/60 text-xs text-muted-foreground">
                          No bids recorded for this property yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {propertyBids.map((b, idx) => (
                            <div
                              key={b.id || idx}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                                idx === 0
                                  ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                                  : "bg-card/90 border-border/60"
                              }`}
                            >
                              {/* Bidder Identity */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-amber-400 animate-pulse" : "bg-slate-500"}`} />
                                  <span className="font-bold text-foreground text-sm flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-amber-500" />
                                    {b.bidder_name}
                                  </span>
                                  {idx === 0 && (
                                    <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold py-0 px-1.5">
                                      Top / Winning Bid
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] capitalize font-mono">
                                    {b.status}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-muted-foreground/80" />
                                    {b.bidder_email}
                                  </span>
                                  {b.bidder_phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-muted-foreground/80" />
                                      {b.bidder_phone}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground/60">•</span>
                                  <span>{new Date(b.created_at).toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Bid Amount */}
                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                                  Bid Placed
                                </span>
                                <span className="text-lg font-extrabold font-mono text-foreground">
                                  {formatPrice(b.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* Admin Audit Log Modal */}
      <AnimatePresence>
        {selectedAuction && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedAuction.property_image && (
                    <img
                      src={getImageUrl(selectedAuction.property_image)}
                      alt={selectedAuction.title}
                      className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/property-fallback.jpg";
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      Bidding Audit Trail
                    </h3>
                    <p className="text-xs text-muted-foreground">{selectedAuction.title}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAuction(null)}
                  className="rounded-full h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 text-xs">
                  <div>
                    <span className="text-muted-foreground">Reserve Price:</span>
                    <p className="font-bold font-mono">{formatPrice(selectedAuction.reserve_price || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Highest Bid:</span>
                    <p className="font-bold font-mono text-amber-500">
                      {selectedAuction.current_highest_bid ? formatPrice(selectedAuction.current_highest_bid) : "None"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-bold capitalize">{selectedAuction.auction_status}</p>
                  </div>
                </div>

                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
                  Complete Bid History & Bidder Profiles
                </h4>

                {loadingAudit ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                  </div>
                ) : auditBids.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No bids recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {auditBids.map((b, idx) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          idx === 0
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-card border-border/60"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{b.bidder_name}</span>
                            {idx === 0 && (
                              <Badge className="bg-amber-500 text-slate-950 text-[10px] py-0 px-1.5 font-bold">
                                Highest
                              </Badge>
                            )}
                            <span className="text-muted-foreground font-mono text-[11px]">
                              ({b.bidder_email})
                            </span>
                          </div>
                          {b.bidder_phone && (
                            <div className="text-[11px] text-muted-foreground">
                              Tel: {b.bidder_phone}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground">
                            Timestamp: {new Date(b.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-extrabold font-mono text-foreground">
                            {formatPrice(b.amount)}
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {b.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border flex justify-end">
                <Button onClick={() => setSelectedAuction(null)} variant="outline" size="sm" className="rounded-xl">
                  Close Audit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
