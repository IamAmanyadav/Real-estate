"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/constants";
import type { BidItem } from "@/types";

export type AuctionConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface AuctionWebSocketPayload {
  event: string;
  property_id: string;
  current_highest_bid?: number;
  min_next_bid?: number;
  time_remaining_seconds?: number;
  extended?: boolean;
  bid?: {
    id: string;
    amount: number;
    created_at: string;
    bidder_label: string;
    status: string;
  };
  reserve_price?: number;
  auction_status?: string;
  auction_end_date?: string;
}

interface UseAuctionWebSocketOptions {
  propertyId: string | null;
  onNewBid?: (data: {
    currentHighestBid: number;
    minNextBid: number;
    timeRemainingSeconds: number;
    extended?: boolean;
    bid?: BidItem;
  }) => void;
  onAuctionStatusChanged?: (newStatus: string) => void;
  onReserveUpdated?: (reservePrice: number, status?: string) => void;
}

export function useAuctionWebSocket({
  propertyId,
  onNewBid,
  onAuctionStatusChanged,
  onReserveUpdated,
}: UseAuctionWebSocketOptions) {
  const [status, setStatus] = useState<AuctionConnectionStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const onNewBidRef = useRef(onNewBid);
  onNewBidRef.current = onNewBid;

  const onAuctionStatusChangedRef = useRef(onAuctionStatusChanged);
  onAuctionStatusChangedRef.current = onAuctionStatusChanged;

  const onReserveUpdatedRef = useRef(onReserveUpdated);
  onReserveUpdatedRef.current = onReserveUpdated;

  const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    try {
      const clerk = (window as any).Clerk;
      if (clerk && clerk.session) {
        const token = await clerk.session.getToken();
        if (token) return token;
      }
    } catch {
      // ignore
    }
    return localStorage.getItem("luxe_token");
  };

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!propertyId || isUnmountedRef.current) return;

    cleanup();
    setStatus("connecting");

    const token = await getAuthToken();

    try {
      const baseUrl = API_BASE_URL.replace(/^http/, "ws");
      const queryParam = token ? `?token=${encodeURIComponent(token)}` : "";
      const wsUrl = `${baseUrl}/bidding/ws/${propertyId}${queryParam}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) {
          socket.close();
          return;
        }
        setStatus("connected");
        retryCountRef.current = 0;

        // Keep-alive heartbeat ping every 25 seconds
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        try {
          if (event.data === "pong") return;
          const payload: AuctionWebSocketPayload = JSON.parse(event.data);

          if (payload.event === "NEW_BID") {
            onNewBidRef.current?.({
              currentHighestBid: payload.current_highest_bid || 0,
              minNextBid: payload.min_next_bid || 0,
              timeRemainingSeconds: payload.time_remaining_seconds || 0,
              extended: payload.extended,
              bid: payload.bid
                ? {
                    id: payload.bid.id,
                    propertyId: payload.property_id,
                    amount: payload.bid.amount,
                    createdAt: payload.bid.created_at,
                    bidderLabel: payload.bid.bidder_label,
                    status: payload.bid.status as any,
                    isCurrentUser: false,
                  }
                : undefined,
            });
          } else if (payload.event === "AUCTION_STATUS_CHANGED" && payload.auction_status) {
            onAuctionStatusChangedRef.current?.(payload.auction_status);
          } else if (payload.event === "RESERVE_UPDATED" && payload.reserve_price) {
            onReserveUpdatedRef.current?.(payload.reserve_price, payload.auction_status);
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      socket.onerror = () => {
        setStatus("error");
      };

      socket.onclose = (event) => {
        if (isUnmountedRef.current) return;
        setStatus("disconnected");

        // Reconnect with backoff
        if (event.code !== 1000 && event.code !== 1008) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          retryCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setStatus("error");
    }
  }, [propertyId, cleanup]);

  useEffect(() => {
    isUnmountedRef.current = false;
    if (propertyId) {
      connect();
    }

    const handleOnline = () => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      isUnmountedRef.current = true;
      cleanup();
      window.removeEventListener("online", handleOnline);
    };
  }, [propertyId, connect, cleanup]);

  return {
    status,
    isConnected: status === "connected",
    reconnect: connect,
  };
}
