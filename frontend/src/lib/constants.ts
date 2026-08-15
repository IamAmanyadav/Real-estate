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
  { label: "Townhouse", value: "townhouse" },
  { label: "Villa", value: "villa" },
];

export const PRICE_RANGES = [
  { label: "Any Price", value: "any" },
  { label: "Under 5 Lakh", value: "0-200000" },
  { label: "5 - 10 Lakh", value: "200000-500000" },
  { label: "10 - 20 Lakh", value: "500000-1000000" },
  { label: "20 - 30 Lakh", value: "1000000-2000000" },
  { label: "30+ Lakh", value: "2000000-999999999" },
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
    name: "Anil Rai",
    role: "Homeowner",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    content: "Luxe Estates made finding our dream home an absolute pleasure. Their attention to detail and understanding of our needs was exceptional. We couldn't be happier with our new home!",
    rating: 5,
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
  { value: "5+", label: "Properties Sold" },
  { value: "1", label: "Years Experience" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "10+", label: "Expert Agents" },
];

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
