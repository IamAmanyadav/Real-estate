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
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface LiveBiddingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle?: string;
  propertyCode?: string | null;
  initialPrice: number;
  onBidPlaced?: (newAmount: number) => void;
}

export function LiveBiddingDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  propertyCode,
  initialPrice,
  onBidPlaced,
}: LiveBiddingDialogProps) {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [customBid, setCustomBid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [justExtended, setJustExtended] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch initial state when dialog opens or property changes
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
      console.error("Failed to load auction data in dialog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, propertyId]);

  // WebSocket for sub-second updates
  const { isConnected } = useAuctionWebSocket({
    propertyId: open ? propertyId : null,
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
      setAuctionState((prev) => (prev ? { ...prev, auctionStatus: newStatus as any } : prev));
    },
    onReserveUpdated: (reserve) => {
      setAuctionState((prev) => (prev ? { ...prev, reservePrice: reserve } : prev));
    },
  });

  // Local second countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          getAuctionState(propertyId).then(setAuctionState).catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, propertyId]);

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

  const isUrgent = !isWaitingForFirstBid && timeRemaining > 0 && timeRemaining < 300;

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
      onBidPlaced?.(amount);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden border border-border/80 bg-slate-950 text-white shadow-2xl rounded-2xl sm:max-w-md">
        {/* Subtle Ambient Header Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-amber-500/15 blur-2xl rounded-full pointer-events-none" />

        {/* Dialog Header */}
        <div className="p-5 pb-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              {!isAuctionEnded ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="font-bold tracking-wider text-xs uppercase text-amber-400 flex items-center gap-1">
                <Gavel className="w-3.5 h-3.5" />
                {!isAuctionEnded ? "Place Live Bid" : "Auction Ended"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pr-6">
              {isConnected && (
                <Badge variant="outline" className="text-[9px] py-0.5 px-2 text-emerald-400 border-emerald-500/30 bg-emerald-950/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Live Sync
                </Badge>
              )}
              <Badge variant="outline" className="text-[9px] py-0.5 px-2 text-slate-300 border-slate-700 bg-slate-800/60">
                {auctionState?.totalBids || 0} Bids
              </Badge>
            </div>
          </div>

          <DialogTitle className="text-base font-bold text-white line-clamp-1">
            {propertyTitle || "Property Auction"}
          </DialogTitle>
          {propertyCode && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Ref ID: {propertyCode}
            </p>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Anti-Sniping Alert */}
          <AnimatePresence>
            {justExtended && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-200"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>
                  <strong>Anti-Sniping Activated:</strong> Bid placed within final 1 hour — Auction extended by 1 more day!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

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
                  Max Bid (Up to +10%)
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

          {/* Highest Bidder Notice */}
          {auctionState?.isHighestBidder && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>You currently hold the highest bid on this property!</span>
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/50 flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Area for Buyers */}
          {!isAuctionEnded && !auctionState?.isSeller && (
            <div className="space-y-3 pt-1">
              {/* Custom Bid Input & Always Clickable Button */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Enter Custom Bid Amount (less than or up to 10%):
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
                      className="pl-7 h-11 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm rounded-xl focus-visible:ring-amber-500"
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

          {/* Seller Notice */}
          {auctionState?.isSeller && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-amber-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Seller Monitor
              </div>
              <p className="text-[11px] text-slate-400">
                You are the listing seller. Bidders remain anonymized. You will receive the winner's details upon conclusion.
              </p>
            </div>
          )}

          {/* Auction Concluded Notice */}
          {isAuctionEnded && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <h4 className="font-bold text-white text-xs">Auction Concluded</h4>
              <p className="text-xs text-slate-400">
                Winning Offer: <strong className="text-amber-400 font-mono">{formatPrice(currentPrice)}</strong>
              </p>
            </div>
          )}

          {/* Collapsible Live Bid History Feed */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Live Bid Feed ({bids.length})
              </span>
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                {bids.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 text-xs">
                    No bids yet. Be the first to place a bid!
                  </div>
                ) : (
                  bids.map((bid, index) => (
                    <div
                      key={bid.id || index}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                        index === 0
                          ? "bg-amber-500/10 border border-amber-500/30"
                          : "bg-slate-900/60 border border-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? "bg-amber-400" : "bg-slate-600"}`} />
                        <span className={`font-medium ${bid.isCurrentUser ? "text-amber-300 font-bold" : "text-slate-300"}`}>
                          {bid.bidderLabel}
                        </span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-[8px] py-0 px-1 text-amber-400 border-amber-500/40">
                            Leading
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-xs">
                          {formatPrice(bid.amount)}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
