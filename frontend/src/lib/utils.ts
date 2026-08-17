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

export function parseImages(images: any): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (images.includes(",")) {
        return images.split(",").map(s => s.trim());
      }
      return [images];
    }
  }
  return [];
}

export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:8000';
    return `${baseUrl}${url}`;
  }
  return url;
}
