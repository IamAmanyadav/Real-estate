// ============================================
// Seller API Client — uses unified auth tokens
// ============================================

import axios from "axios";
import type {
  SellerProperty,
  SellerDashboardStats,
  PaginatedResponse,
} from "@/types";
import { API_BASE_URL } from "./constants";

const sellerApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token
sellerApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("luxe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401
sellerApi.interceptors.response.use(
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

// ── Properties ───────────────────────────────────────────────────────────────

export async function getSellerProperties(params?: {
  verificationStatus?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<SellerProperty>> {
  const { data } = await sellerApi.get<PaginatedResponse<SellerProperty>>(
    "/seller/properties",
    { params }
  );
  return data;
}

export async function getSellerProperty(id: string): Promise<SellerProperty> {
  const { data } = await sellerApi.get<SellerProperty>(
    `/seller/properties/${id}`
  );
  return data;
}

export async function createSellerProperty(
  propertyData: Record<string, unknown>
): Promise<SellerProperty> {
  const { data } = await sellerApi.post<SellerProperty>(
    "/seller/properties",
    propertyData
  );
  return data;
}

export async function updateSellerProperty(
  id: string,
  updates: Record<string, unknown>
): Promise<SellerProperty> {
  const { data } = await sellerApi.put<SellerProperty>(
    `/seller/properties/${id}`,
    updates
  );
  return data;
}

export async function deleteSellerProperty(id: string): Promise<void> {
  await sellerApi.delete(`/seller/properties/${id}`);
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getSellerDashboardStats(): Promise<SellerDashboardStats> {
  const { data } = await sellerApi.get<SellerDashboardStats>(
    "/seller/dashboard-stats"
  );
  return data;
}

// ── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadPropertyImages(
  files: File[]
): Promise<{ urls: string[]; count: number }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await sellerApi.post<{ urls: string[]; count: number }>(
    "/uploads/images",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // 60s for large uploads
    }
  );
  return data;
}

export default sellerApi;
