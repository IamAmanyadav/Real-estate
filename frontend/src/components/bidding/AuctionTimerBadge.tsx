"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuctionState } from "@/lib/bidding-api";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";

interface AuctionTimerBadgeProps {
  propertyId: string;
  initialTimeRemaining?: number;
  className?: string;
  onTimeUpdate?: (seconds: number) => void;
}

export function AuctionTimerBadge({
  propertyId,
  initialTimeRemaining,
  className = "",
  onTimeUpdate,
}: AuctionTimerBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining || 0);
  const [isWaitingForFirstBid, setIsWaitingForFirstBid] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [loading, setLoading] = useState(!initialTimeRemaining);

  useEffect(() => {
    let mounted = true;
    getAuctionState(propertyId)
      .then((state) => {
        if (!mounted) return;
        const waiting =
          state.auctionStatus === "waiting_for_bids" ||
          (state.totalBids === 0 && !state.currentHighestBid && state.timeRemainingSeconds === 0);

        setIsWaitingForFirstBid(waiting);
        setTimeRemaining(state.timeRemainingSeconds);
        setIsEnded(
          !waiting &&
          (state.auctionStatus === "ended" ||
            state.auctionStatus === "accepted" ||
            state.auctionStatus === "offline_completed" ||
            state.timeRemainingSeconds <= 0)
        );
        onTimeUpdate?.(state.timeRemainingSeconds);
      })
      .catch((err) => {
        console.error("Failed to get auction state for timer", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [propertyId]);

  // WebSocket sync for time changes & status
  useAuctionWebSocket({
    propertyId,
    onNewBid: (data) => {
      setIsWaitingForFirstBid(false);
      setIsEnded(false);
      setTimeRemaining(data.timeRemainingSeconds);
      onTimeUpdate?.(data.timeRemainingSeconds);
    },
    onAuctionStatusChanged: (newStatus) => {
      if (
        newStatus === "ended" ||
        newStatus === "accepted" ||
        newStatus === "offline_completed"
      ) {
        setIsEnded(true);
        setIsWaitingForFirstBid(false);
        setTimeRemaining(0);
      } else if (newStatus === "waiting_for_bids") {
        setIsWaitingForFirstBid(true);
        setIsEnded(false);
      }
    },
  });

  // Local second-by-second countdown
  useEffect(() => {
    if (isWaitingForFirstBid) return;

    if (timeRemaining <= 0) {
      if (!isWaitingForFirstBid) {
        setIsEnded(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsEnded(true);
          onTimeUpdate?.(0);
          return 0;
        }
        const next = prev - 1;
        onTimeUpdate?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isWaitingForFirstBid]);

  const timerText = useMemo(() => {
    if (isWaitingForFirstBid) return "Starts on 1st Bid";
    if (timeRemaining <= 0) return "Auction Ended";
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = Math.floor(timeRemaining % 60);

    if (days > 0) {
      return `${days}d : ${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}s`;
    }
    return `${String(hours).padStart(2, "0")}h : ${String(minutes).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}s`;
  }, [timeRemaining, isWaitingForFirstBid]);

  const isUrgent = !isEnded && !isWaitingForFirstBid && timeRemaining > 0 && timeRemaining < 300;

  if (loading && !timeRemaining && !isWaitingForFirstBid) {
    return (
      <div className={`text-xs font-mono text-muted-foreground animate-pulse text-center ${className}`}>
        --:--:--
      </div>
    );
  }

  if (isWaitingForFirstBid) {
    return (
      <div
        className={`text-xs font-mono font-bold tracking-wide text-amber-500 dark:text-amber-400 text-center select-none ${className}`}
      >
        Starts on 1st Bid
      </div>
    );
  }

  if (isEnded) {
    return (
      <div className={`text-[11px] font-mono font-semibold text-muted-foreground text-center select-none ${className}`}>
        Auction Ended
      </div>
    );
  }

  return (
    <div
      className={`text-xs font-mono font-bold tracking-wider text-center select-none ${
        isUrgent
          ? "text-red-500 animate-pulse font-extrabold"
          : "text-amber-500 dark:text-amber-400"
      } ${className}`}
    >
      {timerText}
    </div>
  );
}
