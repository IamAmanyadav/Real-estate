// ============================================
// Real Estate App - TypeScript Type Definitions
// ============================================

export interface Property {
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
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  area: number; // sqft
  propertyType: PropertyType;
  status: PropertyStatus;
  yearBuilt: number;
  images: string[];
  features: string[];
  agent: Agent;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType = "house" | "apartment" | "condo" | "townhouse" | "villa";

export type PropertyStatus = "for_sale" | "for_rent" | "sold" | "pending";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  title: string;
}

export interface PropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export type SortOption = "price_asc" | "price_desc" | "newest" | "oldest";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Inquiry {
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string;
}

export interface InquiryResponse {
  id: string;
  message: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: BlogAuthor;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
}

export interface BlogAuthor {
  name: string;
  avatar: string;
  role: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  label: string;
  value: string;
  icon: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

// ── Seller types ──────────────────────────────────────────────────────────────

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "published"
  | "sold"
  | "archived";

export type DocumentType =
  | "title_deed"
  | "ownership_certificate"
  | "tax_receipt"
  | "identity_proof"
  | "noc"
  | "encumbrance_certificate"
  | "other";

export interface PropertyDocument {
  id: string;
  documentType: DocumentType;
  documentUrl: string;
  documentName: string;
  status: "pending" | "verified" | "rejected";
  adminNote: string | null;
}

export interface SellerProperty {
  id: string;
  propertyId: string;
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
  documents: PropertyDocument[];
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerDashboardStats {
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  publishedListings: number;
  soldListings: number;
  archivedListings: number;
  rejectedListings: number;
  totalInquiriesReceived: number;
}

// ── Buyer types ───────────────────────────────────────────────────────────────

export type InquiryType = "inquiry" | "purchase_request";
export type TrackingStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

export interface BuyerInquiry {
  id: string;
  propertyId: string | null;
  propertyTitle: string | null;
  propertyImage: string | null;
  propertyPrice: number | null;
  message: string;
  inquiryType: InquiryType;
  trackingStatus: TrackingStatus;
  adminResponse: string | null;
  inquiryStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerDashboardStats {
  totalInquiries: number;
  purchaseRequests: number;
  pendingResponses: number;
  respondedInquiries: number;
}

// ── Appointment types ─────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "completed"
  | "rescheduled";

export interface TimeSlot {
  id: string;
  propertyId: string;
  propertyTitle: string;
  sellerId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string | null;
  propertyAddress: string | null;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  timeSlotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  adminNotes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
