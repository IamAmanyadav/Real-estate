// ============================================
// Real Estate App - Constants
// ============================================

import type { NavLink, FAQ, Testimonial } from "@/types";

export const APP_NAME = "Luxe Estates";
export const APP_DESCRIPTION = "Discover your dream property with Luxe Estates — premium real estate solutions for modern living.";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
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
  { label: "Under $200K", value: "0-200000" },
  { label: "$200K - $500K", value: "200000-500000" },
  { label: "$500K - $1M", value: "500000-1000000" },
  { label: "$1M - $2M", value: "1000000-2000000" },
  { label: "$2M+", value: "2000000-999999999" },
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

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    role: "Homeowner",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    content: "Luxe Estates made finding our dream home an absolute pleasure. Their attention to detail and understanding of our needs was exceptional. We couldn't be happier with our new home!",
    rating: 5,
  },
  {
    id: "2",
    name: "James Rodriguez",
    role: "Property Investor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "As an investor, I need a real estate partner who understands market trends. Luxe Estates consistently delivers properties with excellent ROI potential. Highly recommended!",
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Chen",
    role: "First-time Buyer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "Being a first-time buyer was daunting, but the team at Luxe Estates guided us through every step. Their patience and expertise made the process seamless and stress-free.",
    rating: 5,
  },
  {
    id: "4",
    name: "Michael Thompson",
    role: "Relocated Professional",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content: "Relocating across the country was stressful, but Luxe Estates found us the perfect home within our budget and timeline. Their virtual tour feature was a game-changer!",
    rating: 4,
  },
];

export const FAQS: FAQ[] = [
  {
    question: "How do I schedule a property viewing?",
    answer: "You can schedule a viewing by clicking the 'Schedule Tour' button on any property listing, or by contacting our team directly through the contact form. We offer both in-person and virtual tours for your convenience.",
  },
  {
    question: "What documents do I need to buy a property?",
    answer: "Typically, you'll need proof of identity (passport or driver's license), proof of income (pay stubs or tax returns), bank statements, and a pre-approval letter from your mortgage lender. Our agents will guide you through the specific requirements.",
  },
  {
    question: "Do you offer financing assistance?",
    answer: "Yes! We partner with multiple mortgage lenders to help you find the best financing options. Our team can connect you with trusted financial advisors who specialize in real estate financing.",
  },
  {
    question: "How long does the buying process take?",
    answer: "The typical home buying process takes 30-60 days from offer acceptance to closing. However, this can vary based on factors like financing, inspections, and negotiations. We work to make the process as efficient as possible.",
  },
  {
    question: "Can I sell my current home while buying a new one?",
    answer: "Absolutely! Many of our clients buy and sell simultaneously. We offer bridge financing options and can help coordinate the timing of both transactions to ensure a smooth transition.",
  },
  {
    question: "What areas do you serve?",
    answer: "We currently serve major metropolitan areas across the United States, including New York, Los Angeles, Miami, Chicago, San Francisco, and many more. Contact us to learn if we operate in your desired area.",
  },
  {
    question: "Are there any hidden fees?",
    answer: "We believe in complete transparency. All fees and commissions are clearly outlined before you commit to any transaction. There are no hidden charges — what you see is what you get.",
  },
  {
    question: "Do you handle rental properties as well?",
    answer: "Yes, we have a dedicated rental division that handles both short-term and long-term rental properties. Whether you're looking to rent or list your property for rent, we can help.",
  },
];

export const COMPANY_STATS = [
  { value: "2,500+", label: "Properties Sold" },
  { value: "15+", label: "Years Experience" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "50+", label: "Expert Agents" },
];

export const FOOTER_LINKS = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/about#team" },
    { label: "Careers", href: "/about#careers" },
    { label: "Contact", href: "/contact" },
  ],
  properties: [
    { label: "Buy Property", href: "/properties" },
    { label: "Rent Property", href: "/properties?status=for_rent" },
    { label: "New Listings", href: "/properties?sort=newest" },
    { label: "Featured", href: "/properties?featured=true" },
  ],
  resources: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Market Reports", href: "/blog?category=market-analysis" },
    { label: "Buying Guide", href: "/blog?category=buying-guide" },
  ],
};
