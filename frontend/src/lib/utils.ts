import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
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
