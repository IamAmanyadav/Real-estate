// ============================================
// Real Estate App - API Client
// ============================================

import axios from "axios";
import type {
  Property,
  PropertyFilters,
  PaginatedResponse,
  Inquiry,
  InquiryResponse,
  BlogPost,
} from "@/types";
import { API_BASE_URL } from "./constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Properties ----

export async function getProperties(
  filters?: PropertyFilters
): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.location) params.append("location", filters.location);
    if (filters.minPrice) params.append("min_price", String(filters.minPrice));
    if (filters.maxPrice) params.append("max_price", String(filters.maxPrice));
    if (filters.bedrooms) params.append("bedrooms", String(filters.bedrooms));
    if (filters.bathrooms) params.append("bathrooms", String(filters.bathrooms));
    if (filters.propertyType) params.append("property_type", filters.propertyType);
    if (filters.sortBy) params.append("sort_by", filters.sortBy);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
  }

  const { data } = await api.get<PaginatedResponse<Property>>(
    `/properties?${params.toString()}`
  );
  return data;
}

export async function getPropertyById(id: string): Promise<Property> {
  const { data } = await api.get<Property>(`/properties/${id}`);
  return data;
}

export async function searchProperties(
  filters: PropertyFilters
): Promise<PaginatedResponse<Property>> {
  return getProperties(filters);
}

// ---- Inquiries ----

export async function submitInquiry(inquiry: Inquiry, token?: string): Promise<InquiryResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const { data } = await api.post<InquiryResponse>("/inquiries", inquiry, { headers });
  return data;
}

// ---- Blog ----

export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data } = await api.get<BlogPost[]>("/blog/posts");
  return data;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost> {
  const { data } = await api.get<BlogPost>(`/blog/posts/${slug}`);
  return data;
}

export default api;
