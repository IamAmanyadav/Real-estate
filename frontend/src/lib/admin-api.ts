// ============================================
// Admin API Client — uses unified auth tokens
// ============================================

import axios from "axios";
import type {
  AdminUser,
  AdminProperty,
  AdminInquiry,
  PaginatedResponse,
  DashboardData,
} from "@/types/admin";
import { API_BASE_URL } from "./constants";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

import { attachAuthToken } from "./utils";

// Attach JWT token to every request
adminApi.interceptors.request.use(attachAuthToken);

// Auto-logout on 401
adminApi.interceptors.response.use(
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

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const { data } = await adminApi.get<DashboardData>("/admin/analytics/overview");
  return data;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getAdminUsers(params?: {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await adminApi.get<PaginatedResponse<AdminUser>>("/admin/users", { params });
  return data;
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const { data } = await adminApi.get<AdminUser>(`/admin/users/${id}`);
  return data;
}

export async function updateAdminUser(id: string, updates: Record<string, unknown>): Promise<AdminUser> {
  const { data } = await adminApi.put<AdminUser>(`/admin/users/${id}`, updates);
  return data;
}

export async function updateUserStatus(id: string, status: string, reason?: string): Promise<AdminUser> {
  const { data } = await adminApi.patch<AdminUser>(`/admin/users/${id}/status`, { status, reason });
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await adminApi.delete(`/admin/users/${id}`);
}

// ── Properties ───────────────────────────────────────────────────────────────

export async function getAdminProperties(params?: {
  search?: string;
  propertyType?: string;
  status?: string;
  verificationStatus?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminProperty>> {
  const { data } = await adminApi.get<PaginatedResponse<AdminProperty>>("/admin/properties", { params });
  return data;
}

export async function getAdminProperty(id: string): Promise<AdminProperty> {
  const { data } = await adminApi.get<AdminProperty>(`/admin/properties/${id}`);
  return data;
}

export async function updateAdminProperty(id: string, updates: Record<string, unknown>): Promise<AdminProperty> {
  const { data } = await adminApi.put<AdminProperty>(`/admin/properties/${id}`, updates);
  return data;
}

export async function updatePropertyVerification(
  id: string,
  verificationStatus: string,
  reason?: string,
): Promise<AdminProperty> {
  const { data } = await adminApi.patch<AdminProperty>(`/admin/properties/${id}/verification`, {
    verificationStatus,
    reason,
  });
  return data;
}

export async function deleteAdminProperty(id: string): Promise<void> {
  await adminApi.delete(`/admin/properties/${id}`);
}

// ── Inquiries ────────────────────────────────────────────────────────────────

export async function getAdminInquiries(params?: {
  inquiryStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AdminInquiry>> {
  const { data } = await adminApi.get<PaginatedResponse<AdminInquiry>>("/admin/inquiries", { params });
  return data;
}

export async function updateInquiryStatus(
  id: string,
  inquiry_status: string,
  admin_notes?: string,
): Promise<AdminInquiry> {
  const { data } = await adminApi.patch<AdminInquiry>(`/admin/inquiries/${id}`, {
    inquiry_status,
    admin_notes,
  });
  return data;
}

export async function deleteAdminInquiry(id: string): Promise<void> {
  await adminApi.delete(`/admin/inquiries/${id}`);
}

export default adminApi;
