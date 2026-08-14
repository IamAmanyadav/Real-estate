// ============================================
// Real Estate App - Constants
// ============================================

import type { NavLink, FAQ, Testimonial } from "@/types";

export const APP_NAME = "Luxe Estates";
export const APP_DESCRIPTION = "Discover your dream property with Luxe Estates — premium real estate solutions for modern living.";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export const PROPERTY_TYPES = [
  { label: "All Types", value: "all" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Condo", value: "condo" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Villa", value: "villa" },
];

export const PRICE_RANGES = [
  { label: "Any Price", value: "any" },
  { label: "Under ₹50 Lakh", value: "0-5000000" },
  { label: "₹50 Lakh - ₹1 Cr", value: "5000000-10000000" },
  { label: "₹1 Cr - ₹5 Cr", value: "10000000-50000000" },
  { label: "₹5 Cr - ₹10 Cr", value: "50000000-100000000" },
  { label: "₹10 Cr+", value: "100000000-9999999999" },
];

export const BEDROOM_OPTIONS = [
  { label: "Any", value: "any" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "5+", value: "5" },
];

export const BATHROOM_OPTIONS = [
  { label: "Any", value: "any" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];

export const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export const TESTIMONIALS: Testimonial[] = [];

export const FAQS: FAQ[] = [];

export const COMPANY_STATS: { value: string; label: string }[] = [];

export const FOOTER_LINKS = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "Careers", href: "/about#careers" },
    { label: "Contact", href: "/contact" },
  ],

  resources: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Market Reports", href: "/blog?category=market-analysis" },
    { label: "Buying Guide", href: "/blog?category=buying-guide" },
  ],
};
