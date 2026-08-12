// ============================================
// Buyer API Client — uses unified auth tokens
// ============================================

import axios from "axios";
import type {
  BuyerInquiry,
  BuyerDashboardStats,
  PaginatedResponse,
} from "@/types";
import { API_BASE_URL } from "./constants";

const buyerApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

import { attachAuthToken } from "./utils";

// Attach JWT token
buyerApi.interceptors.request.use(attachAuthToken);

// Auto-logout on 401
buyerApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("luxe_token");
      localStorage.removeItem("luxe_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Inquiries ────────────────────────────────────────────────────────────────

export async function getBuyerInquiries(params?: {
  inquiryType?: string;
  trackingStatus?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<BuyerInquiry>> {
  const { data } = await buyerApi.get<PaginatedResponse<BuyerInquiry>>(
    "/buyer/inquiries",
    { params }
  );
  return data;
}

export async function getBuyerInquiry(id: string): Promise<BuyerInquiry> {
  const { data } = await buyerApi.get<BuyerInquiry>(`/buyer/inquiries/${id}`);
  return data;
}

export async function createBuyerInquiry(inquiryData: {
  propertyId: string;
  message: string;
  inquiryType: "inquiry" | "purchase_request";
  phone?: string;
}): Promise<BuyerInquiry> {
  const { data } = await buyerApi.post<BuyerInquiry>(
    "/buyer/inquiries",
    inquiryData
  );
  return data;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getBuyerDashboardStats(): Promise<BuyerDashboardStats> {
  const { data } = await buyerApi.get<BuyerDashboardStats>(
    "/buyer/dashboard-stats"
  );
  return data;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await buyerApi.get<UserProfile>("/auth/profile");
  return data;
}

export async function updateProfile(updates: {
  fullName?: string;
  phone?: string;
  bio?: string;
}): Promise<UserProfile> {
  const { data } = await buyerApi.put<UserProfile>("/auth/profile", updates);
  return data;
}

export default buyerApi;
