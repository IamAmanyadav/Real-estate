// ============================================
// Bidding / Auction API Client
// ============================================

import axios from "axios";
import type {
  AuctionState,
  BidItem,
  MyBidItem,
  AdminAuctionOverviewItem,
  AdminBidItem,
} from "@/types";
import { API_BASE_URL } from "./constants";
import { attachAuthToken } from "./utils";

const biddingApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

biddingApi.interceptors.request.use(attachAuthToken);

// ── Public / Buyer / Seller ──────────────────────────────────────────────────

export async function getAuctionState(propertyId: string): Promise<AuctionState> {
  const { data } = await biddingApi.get<AuctionState>(`/bidding/${propertyId}/state`);
  return {
    propertyId: (data as any).property_id || (data as any).propertyId,
    title: data.title,
    propertyCode: (data as any).property_code || (data as any).propertyCode,
    propertyImage: (data as any).property_image || (data as any).propertyImage || null,
    isAuction: (data as any).is_auction ?? (data as any).isAuction ?? true,
    reservePrice: Number((data as any).reserve_price ?? (data as any).reservePrice ?? 0),
    currentHighestBid: (data as any).current_highest_bid != null ? Number((data as any).current_highest_bid) : (data as any).currentHighestBid != null ? Number((data as any).currentHighestBid) : null,
    minNextBid: Number((data as any).min_next_bid ?? (data as any).minNextBid ?? 0),
    minBidIncrement: Number((data as any).min_bid_increment ?? (data as any).minBidIncrement ?? 1000),
    auctionStartDate: (data as any).auction_start_date || (data as any).auctionStartDate,
    auctionEndDate: (data as any).auction_end_date || (data as any).auctionEndDate,
    auctionStatus: (data as any).auction_status || (data as any).auctionStatus || "active",
    totalBids: (data as any).total_bids ?? (data as any).totalBids ?? 0,
    timeRemainingSeconds: (data as any).time_remaining_seconds ?? (data as any).timeRemainingSeconds ?? 0,
    isSeller: (data as any).is_seller ?? (data as any).isSeller ?? false,
    isHighestBidder: (data as any).is_highest_bidder ?? (data as any).isHighestBidder ?? false,
    winningBidAmount: (data as any).winning_bid_amount != null ? Number((data as any).winning_bid_amount) : (data as any).winningBidAmount != null ? Number((data as any).winningBidAmount) : null,
  };
}

export async function getBidHistory(propertyId: string): Promise<BidItem[]> {
  const { data } = await biddingApi.get<any[]>(`/bidding/${propertyId}/history`);
  return data.map((b) => ({
    id: b.id,
    propertyId: b.property_id || b.propertyId,
    amount: Number(b.amount),
    createdAt: b.created_at || b.createdAt,
    bidderLabel: b.bidder_label || b.bidderLabel || "Bidder",
    status: b.status,
    isCurrentUser: b.is_current_user ?? b.isCurrentUser ?? false,
  }));
}

export async function placeBid(propertyId: string, amount: number): Promise<BidItem> {
  const { data } = await biddingApi.post<any>(`/bidding/${propertyId}/bid`, { amount });
  return {
    id: data.id,
    propertyId: data.property_id || data.propertyId,
    amount: Number(data.amount),
    createdAt: data.created_at || data.createdAt,
    bidderLabel: data.bidder_label || data.bidderLabel || "You",
    status: data.status,
    isCurrentUser: true,
  };
}

export async function updateSellerReserve(
  propertyId: string,
  reservePrice: number,
  extendDays?: number
): Promise<AuctionState> {
  const { data } = await biddingApi.post<any>(`/bidding/${propertyId}/update-reserve`, {
    reserve_price: reservePrice,
    extend_days: extendDays,
  });
  return getAuctionState(propertyId);
}

export async function getMyBids(): Promise<MyBidItem[]> {
  const { data } = await biddingApi.get<MyBidItem[]>("/bidding/my-bids");
  return data;
}

// ── Admin Endpoints ─────────────────────────────────────────────────────────

export async function getAdminAuctions(): Promise<AdminAuctionOverviewItem[]> {
  const { data } = await biddingApi.get<AdminAuctionOverviewItem[]>("/bidding/admin/auctions");
  return data;
}

export async function getAdminAuditHistory(propertyId: string): Promise<AdminBidItem[]> {
  const { data } = await biddingApi.get<AdminBidItem[]>(`/bidding/admin/${propertyId}/audit`);
  return data;
}

export async function setAdminAuctionDecision(
  propertyId: string,
  status: "accepted" | "rejected" | "offline_completed" | "cancelled",
  notes?: string
): Promise<{ message: string }> {
  const { data } = await biddingApi.post<{ message: string }>(
    `/bidding/admin/${propertyId}/decision`,
    { status, notes }
  );
  return data;
}
