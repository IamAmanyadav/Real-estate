import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹${+(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${+(price / 100000).toFixed(2)} Lac`;
  } else {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function getImageUrl(url: any): string {
  if (!url) return "/images/property-fallback.jpg";
  let cleaned = url;
  if (typeof cleaned === "string" && (cleaned.startsWith("[") || cleaned.startsWith("{"))) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleaned = typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url || "";
      } else if (typeof parsed === "object" && parsed !== null) {
        cleaned = parsed.url || "";
      }
    } catch { }
  }
  if (typeof cleaned === "object" && cleaned !== null) {
    cleaned = cleaned.url || "";
  }
  if (typeof cleaned !== "string" || !cleaned.trim()) {
    return "/images/property-fallback.jpg";
  }

  cleaned = cleaned.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const BACKEND_BASE = API_URL.replace(/\/api\/v1\/?$/, "");
  if (cleaned.startsWith("/uploads")) {
    return `${BACKEND_BASE}${cleaned}`;
  }
  if (cleaned.startsWith("uploads/")) {
    return `${BACKEND_BASE}/${cleaned}`;
  }
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  return `${BACKEND_BASE}/${cleaned}`;
}

let tokenPromise: Promise<string | null> | null = null;

export async function attachAuthToken(config: any) {
  if (typeof window !== "undefined") {
    try {
      const clerk = (window as any).Clerk;
      if (clerk && clerk.session) {
        if (!tokenPromise) {
          tokenPromise = clerk.session.getToken().catch((e: any) => {
            console.error("Clerk token error", e);
            return null;
          }).finally(() => {
            tokenPromise = null;
          });
        }
        const token = await tokenPromise;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error("Failed to attach Clerk token", e);
    }
  }
  return config;
}
