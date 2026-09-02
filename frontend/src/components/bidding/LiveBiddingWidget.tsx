"use client";

import { useEffect, useState, useMemo } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  Flame,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAuctionState,
  getBidHistory,
  placeBid,
} from "@/lib/bidding-api";
import { formatPrice } from "@/lib/utils";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import type { AuctionState, BidItem } from "@/types";
import Link from "next/link";

interface LiveBiddingWidgetProps {
  propertyId: string;
  initialPrice: number;
}

export function LiveBiddingWidget({
  propertyId,
  initialPrice,
}: LiveBiddingWidgetProps) {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [customBid, setCustomBid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [justExtended, setJustExtended] = useState(false);

  // Fetch initial state
  const loadData = async () => {
    try {
      setLoading(true);
      const [stateData, historyData] = await Promise.all([
        getAuctionState(propertyId),
        getBidHistory(propertyId),
      ]);
      setAuctionState(stateData);
      setBids(historyData);
      setTimeRemaining(stateData.timeRemainingSeconds);
    } catch (err: any) {
      console.error("Failed to load auction data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [propertyId]);

  // WebSocket for sub-second updates
  const { isConnected } = useAuctionWebSocket({
    propertyId,
    onNewBid: (data) => {
      setAuctionState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentHighestBid: data.currentHighestBid,
          minNextBid: data.minNextBid,
          timeRemainingSeconds: data.timeRemainingSeconds,
          totalBids: prev.totalBids + 1,
        };
      });
      setTimeRemaining(data.timeRemainingSeconds);

      if (data.extended) {
        setJustExtended(true);
        setTimeout(() => setJustExtended(false), 8000);
      }

      if (data.bid) {
        setBids((prev) => [data.bid!, ...prev.filter((b) => b.id !== data.bid!.id)]);
      } else {
        getBidHistory(propertyId).then(setBids).catch(console.error);
      }
    },
    onAuctionStatusChanged: (newStatus) => {
      setAuctionState((prev) => prev ? { ...prev, auctionStatus: newStatus as any } : prev);
    },
    onReserveUpdated: (reserve) => {
      setAuctionState((prev) => prev ? { ...prev, reservePrice: reserve } : prev);
    },
  });

  // Local second-by-second countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Re-fetch auction state when timer hits 0
          getAuctionState(propertyId).then(setAuctionState).catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, propertyId]);

  // Format countdown
  const timerComponents = useMemo(() => {
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = Math.floor(timeRemaining % 60);
    return { days, hours, minutes, seconds };
  }, [timeRemaining]);

  const isWaitingForFirstBid =
    auctionState?.auctionStatus === "waiting_for_bids" ||
    (auctionState?.totalBids === 0 && !auctionState?.currentHighestBid && timeRemaining <= 0);

  const isUrgent = !isWaitingForFirstBid && timeRemaining > 0 && timeRemaining < 300; // < 5 mins
  const isAuctionEnded =
    !isWaitingForFirstBid &&
    (auctionState?.auctionStatus === "ended" ||
      auctionState?.auctionStatus === "accepted" ||
      auctionState?.auctionStatus === "offline_completed" ||
      timeRemaining <= 0);

  const currentPrice =
    auctionState?.currentHighestBid ||
    auctionState?.reservePrice ||
    initialPrice;

  const maxIncrement = useMemo(() => {
    return Math.round(currentPrice * 0.10);
  }, [currentPrice]);

  const maxAllowedBid = useMemo(() => {
    return auctionState?.maxNextBid || (currentPrice + maxIncrement);
  }, [auctionState?.maxNextBid, currentPrice, maxIncrement]);

  const minNextBid = isWaitingForFirstBid
    ? (auctionState?.reservePrice || initialPrice)
    : (auctionState?.minNextBid || currentPrice + 1);
  const minIncrement = auctionState?.minBidIncrement || 1;

  const handlePlaceBid = async (amount: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (amount < minNextBid) {
      setErrorMsg(`Bid amount must be at least ${formatPrice(minNextBid)}`);
      return;
    }

    if (amount > maxAllowedBid) {
      setErrorMsg(
        `In a single turn, the maximum bid allowed is up to 10% over the current price (${formatPrice(maxAllowedBid)} max).`
      );
      return;
    }

    try {
      setSubmitting(true);
      const newBid = await placeBid(propertyId, amount);
      setSuccessMsg(`Your bid of ${formatPrice(amount)} has been placed!`);
      setCustomBid("");
      // Update local state immediately
      const newCurrent = amount;
      const nextMaxInc = Math.round(newCurrent * 0.10);
      setAuctionState((prev) =>
        prev
          ? {
              ...prev,
              currentHighestBid: newCurrent,
              minNextBid: newCurrent + 1,
              maxNextBid: newCurrent + nextMaxInc,
              isHighestBidder: true,
              totalBids: prev.totalBids + 1,
            }
          : prev
      );
      setBids((prev) => [newBid, ...prev.filter((b) => b.id !== newBid.id)]);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to place bid. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomBidSubmit = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const val = customBid.trim();
    if (!val) {
      setErrorMsg(`Please enter an amount between ${formatPrice(minNextBid)} and ${formatPrice(maxAllowedBid)}.`);
      return;
    }

    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setErrorMsg("Please enter a valid bid amount.");
      return;
    }

    if (num < minNextBid) {
      setErrorMsg(`Custom bid must be at least ${formatPrice(minNextBid)} (greater than current price ${formatPrice(currentPrice)}).`);
      return;
    }

    if (num > maxAllowedBid) {
      setErrorMsg(`Custom bid cannot exceed 10% of current price (Max allowed is ${formatPrice(maxAllowedBid)}).`);
      return;
    }

    handlePlaceBid(num);
  };

  if (loading) {
    return (
      <Card className="border-amber-500/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 text-white animate-pulse">
        <div className="h-6 w-32 bg-slate-700 rounded mb-4" />
        <div className="h-10 w-full bg-slate-800 rounded mb-4" />
        <div className="h-20 w-full bg-slate-800 rounded" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-2 border-amber-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 text-white shadow-2xl backdrop-blur-2xl">
      {/* Top pulsating ambient glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

      <CardContent className="p-6 space-y-6">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            {!isAuctionEnded ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
            <span className="font-bold tracking-wider text-xs uppercase text-amber-400 flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5" />
              {!isAuctionEnded ? "Live Dynamic Auction" : "Auction Concluded"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isConnected && (
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                Live Sync
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 bg-slate-800/60">
              {auctionState?.totalBids || 0} Bids
            </Badge>
          </div>
        </div>

        {/* Soft-close Anti-Sniping Notification Alert */}
        <AnimatePresence>
          {justExtended && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center gap-2 text-xs text-amber-200"
            >
              <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span>
                <strong>Anti-Sniping Active:</strong> Bid placed in final 1 hour — Auction extended by 1 more day!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Countdown Clock */}
        {!isAuctionEnded && (
          <div className={`p-4 rounded-xl border transition-all ${
            isUrgent
              ? "bg-red-950/30 border-red-500/50 animate-pulse"
              : "bg-slate-800/40 border-slate-700/60"
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1 font-medium">
                <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-red-400" : "text-amber-400"}`} />
                Time Remaining
              </span>
              {isUrgent && (
                <span className="text-red-400 font-bold tracking-wide animate-bounce flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Closing Soon!
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Days", value: timerComponents.days },
                { label: "Hours", value: timerComponents.hours },
                { label: "Mins", value: timerComponents.minutes },
                { label: "Secs", value: timerComponents.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/80 rounded-lg p-2 border border-slate-800/80">
                  <div className="text-xl font-mono font-extrabold text-white">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simple Clean Price Overview Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Current Price
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {formatPrice(currentPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-amber-400 font-medium uppercase tracking-wider block">
                Max Allowed (+10%)
              </span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">
                {formatPrice(maxAllowedBid)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>You can bid any amount:</span>
            <span className="text-emerald-400 font-mono font-medium">
              {formatPrice(minNextBid)} – {formatPrice(maxAllowedBid)}
            </span>
          </div>
        </div>

        {/* Bidder Status Indicator Banner */}
        {auctionState?.isHighestBidder && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>You currently hold the highest bid on this property!</span>
          </div>
        )}

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Active Bidding Action Panel */}
        {!isAuctionEnded && !auctionState?.isSeller && (
          <div className="space-y-3 pt-2">
            {/* Custom Bid Input & Always Clickable Button */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Enter Custom Bid (less than or up to 10%):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">₹</span>
                  <Input
                    type="number"
                    placeholder={`e.g. ${Math.round(currentPrice * 1.05)}`}
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                    disabled={submitting}
                    className="pl-7 h-11 bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm rounded-xl focus-visible:ring-amber-500"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCustomBidSubmit}
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 h-11 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {submitting ? "Placing..." : "Bid"}
                </Button>
              </div>

              {/* Quick Selection Chips - Percentage Increment Amounts */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400">Quick fill:</span>
                {[
                  { label: "2%", pct: 0.02 },
                  { label: "5%", pct: 0.05 },
                  { label: "7.5%", pct: 0.075 },
                  { label: "10%", pct: 0.10 },
                ].map((item, idx) => {
                  const incAmount = Math.round(currentPrice * item.pct);
                  const targetTotal = currentPrice + incAmount;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomBid(String(targetTotal))}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title={`Bid ${formatPrice(targetTotal)} (+${item.label})`}
                    >
                      <span>+{formatPrice(incAmount)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({item.label})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Full 10% Bid Action */}
            <div className="pt-2 border-t border-slate-800/80">
              <Button
                type="button"
                disabled={submitting}
                onClick={() => handlePlaceBid(maxAllowedBid)}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Instant Max Bid: {formatPrice(maxAllowedBid)} (+10%)</span>
              </Button>
            </div>
          </div>
        )}

        {/* Seller Info Note (if viewing own property) */}
        {auctionState?.isSeller && (
          <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Seller Auction Monitor
            </div>
            <p className="text-[11px] text-slate-400">
              You are the seller of this listing. Bidders are anonymized for privacy. You will receive final winning bid details for offline agreement and handover.
            </p>
          </div>
        )}

        {/* Auction Ended Conclusion State */}
        {isAuctionEnded && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <div className="inline-flex p-2 rounded-full bg-amber-500/10 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Bidding Period Closed</h4>
            <p className="text-xs text-slate-400">
              Final Highest Offer: <strong className="text-amber-400 font-mono">${currentPrice.toLocaleString()}</strong>
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              The seller and admin are finalizing offline documentation and handover.
            </div>
          </div>
        )}

        {/* Live Anonymized Bid History Feed */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Live Bid History
            </span>
            <span className="text-[11px] text-slate-500">Anonymous Feed</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {bids.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                No bids placed yet. Be the first to bid!
              </div>
            ) : (
              bids.map((bid, index) => (
                <div
                  key={bid.id || index}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    index === 0
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "bg-slate-950/40 border border-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${index === 0 ? "bg-amber-400" : "bg-slate-600"}`} />
                    <span className={`font-medium ${bid.isCurrentUser ? "text-amber-300 font-bold" : "text-slate-300"}`}>
                      {bid.bidderLabel}
                    </span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1 text-amber-400 border-amber-500/40">
                        Highest
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white">
                      ${bid.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
