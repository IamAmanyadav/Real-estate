// ============================================
// Admin Dashboard - TypeScript Type Definitions
// ============================================

export type UserRole = "admin" | "seller" | "buyer";
export type UserStatus = "active" | "suspended" | "pending_verification" | "rejected";
export type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "published" | "sold" | "archived";
export type InquiryStatus = "new" | "read" | "responded" | "closed";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  verifiedAt: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  propertyCount: number;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  changedByName: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AdminProperty {
  id: string;
  propertyCode: string | null;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: string;
  yearBuilt: number;
  images: string[];
  features: string[];
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    title: string;
  };
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  sellerId: string | null;
  sellerName: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
}

export interface AdminInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  propertyId: string | null;
  propertyTitle: string | null;
  inquiryStatus: InquiryStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverviewStats {
  totalUsers: number;
  totalProperties: number;
  totalInquiries: number;
  totalRevenue: number;
  activeUsers: number;
  pendingVerifications: number;
  newInquiries: number;
  publishedProperties: number;
}

export interface PropertyAnalytics {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byVerification: Record<string, number>;
}

export interface UserAnalytics {
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardData {
  overview: OverviewStats;
  propertyAnalytics: PropertyAnalytics;
  userAnalytics: UserAnalytics;
  recentActivity: RecentActivityItem[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    avatar: string | null;
  };
}
