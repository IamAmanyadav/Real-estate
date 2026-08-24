"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gavel,
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  Layers,
  Info,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAuctionState,
  getBidHistory,
  updateSellerReserve,
} from "@/lib/bidding-api";
import { formatPrice } from "@/lib/utils";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import type { AuctionState, BidItem } from "@/types";
import Link from "next/link";

export default function SellerAuctionManagementPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Price update state (for after auction ended)
  const [newReservePrice, setNewReservePrice] = useState("");
  const [extendDays, setExtendDays] = useState("7");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadAuction = async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const [stateData, historyData] = await Promise.all([
        getAuctionState(propertyId),
        getBidHistory(propertyId),
      ]);
      setAuction(stateData);
      setBids(historyData);
      setNewReservePrice(String(stateData.reservePrice || ""));
    } catch (err) {
      console.error("Failed to load auction data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuction();
  }, [propertyId]);

  useAuctionWebSocket({
    propertyId,
    onNewBid: (data) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentHighestBid: data.currentHighestBid,
              minNextBid: data.minNextBid,
              timeRemainingSeconds: data.timeRemainingSeconds,
              totalBids: prev.totalBids + 1,
            }
          : prev
      );
      getBidHistory(propertyId).then(setBids).catch(console.error);
    },
    onAuctionStatusChanged: (newStatus) => {
      setAuction((prev) => (prev ? { ...prev, auctionStatus: newStatus as any } : prev));
    },
    onReserveUpdated: (reserve, status) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              reservePrice: reserve,
              auctionStatus: (status as any) || prev.auctionStatus,
            }
          : prev
      );
    },
  });

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReservePrice) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const updated = await updateSellerReserve(
        propertyId,
        parseFloat(newReservePrice),
        parseInt(extendDays) || undefined
      );
      setAuction(updated);
      setFeedback({
        type: "success",
        msg: "Lowest price updated and bidding schedule reopened successfully!",
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update price.";
      setFeedback({ type: "error", msg });
    } finally {
      setSubmitting(false);
    }
  };

  const isEnded =
    auction?.auctionStatus === "ended" ||
    auction?.auctionStatus === "accepted" ||
    auction?.auctionStatus === "offline_completed" ||
    (auction && auction.timeRemainingSeconds <= 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-xl font-bold">Property Auction Not Found</h3>
        <Button asChild>
          <Link href="/dashboard/listings">Back to Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild className="rounded-xl -ml-2 mb-2">
          <Link href="/dashboard/listings">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Listings
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted/60 relative shrink-0 border border-border/60">
              {auction.propertyImage ? (
                <img
                  src={
                    auction.propertyImage.startsWith("/uploads")
                      ? `${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000'}${auction.propertyImage}`
                      : auction.propertyImage
                  }
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground/40">
                  <Building2 className="w-7 h-7" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className="bg-amber-500 text-slate-950 font-bold">
                  SELLER AUCTION MONITOR
                </Badge>
                {auction.propertyCode && (
                  <Badge variant="outline" className="font-mono">
                    {auction.propertyCode}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {auction.title}
              </h1>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/properties/${propertyId}`} target="_blank">
              View Public Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Seller Privacy Note */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
        <span>
          <strong>Strict Seller Privacy Active:</strong> You can only view the Current Price Offer and your Lowest Reserve Price. Bidder identities are blinded to prevent bias.
        </span>
      </div>

      {/* Main Pricing & Auction Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Current Price vs Lowest Price */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Auction Pricing Metrics
              </span>
              <IndianRupee className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground">Current Highest Offer</span>
                <div className="text-3xl font-extrabold font-mono text-emerald-500 mt-0.5">
                  {auction.currentHighestBid
                    ? formatPrice(auction.currentHighestBid)
                    : "No Bids Received Yet"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground">Your Lowest Sell Price (Reserve)</span>
                <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                  {formatPrice(auction.reservePrice)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Status & Time Remaining */}
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Timeline & Engagement
              </span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground">Auction Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    auction.auctionStatus === "active"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : auction.auctionStatus === "offline_completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-white"
                  }>
                    {auction.auctionStatus?.toUpperCase() || "ACTIVE"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({auction.totalBids} total bids placed)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <span className="text-xs text-muted-foreground">End Deadline</span>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {auction.auctionEndDate
                    ? new Date(auction.auctionEndDate).toLocaleString()
                    : "Not specified"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {auction.timeRemainingSeconds > 0
                    ? `${Math.floor(auction.timeRemainingSeconds / 3600)}h ${Math.floor((auction.timeRemainingSeconds % 3600) / 60)}m remaining`
                    : "Bidding window concluded"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post-Auction Lowest Price Update Card (Seller Specific Feature) */}
      <Card className="border-2 border-border/70 bg-card/90 rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg text-foreground">
                Update Lowest Bid Price & Re-open Bidding
              </h3>
              <p className="text-xs text-muted-foreground">
                If the bidding date has ended or you want to adjust your lowest selling price, update it below.
              </p>
            </div>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-red-950/40 border-red-500/50 text-red-300"
            }`}>
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePrice} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newReserve" className="text-xs font-semibold">
                  New Lowest Acceptable Bid (INR / ₹) *
                </Label>
                <Input
                  id="newReserve"
                  type="number"
                  value={newReservePrice}
                  onChange={(e) => setNewReservePrice(e.target.value)}
                  min={1}
                  required
                  className="rounded-xl mt-1.5 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="extendDays" className="text-xs font-semibold">
                  Re-open Bidding Duration (Days)
                </Label>
                <Input
                  id="extendDays"
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  min={1}
                  max={60}
                  className="rounded-xl mt-1.5"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !newReservePrice}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {submitting ? "Updating Price..." : "Update Lowest Price & Re-open"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Anonymized Bid History Feed */}
      <Card className="border-border/60 bg-card/80 rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Anonymized Bid Stream
            </h3>
            <span className="text-xs text-muted-foreground">
              {bids.length} entries
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {bids.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No bids recorded yet.
              </p>
            ) : (
              bids.map((b, i) => (
                <div
                  key={b.id || i}
                  className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-amber-400" : "bg-slate-500"}`} />
                    <span className="font-medium text-foreground">{b.bidderLabel}</span>
                    {i === 0 && (
                      <Badge className="bg-amber-500 text-slate-950 text-[9px] font-bold py-0 px-1">
                        Current Top
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-foreground">
                      {formatPrice(b.amount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(b.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
