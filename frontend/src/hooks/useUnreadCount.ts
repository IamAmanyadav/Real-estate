"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUnreadCount } from "@/lib/messages-api";
import { useAuth } from "@/hooks/useAuth";

// Global cache and subscriber store shared across Header & Sidebar
let globalUnreadCount = 0;
let lastFetchTimestamp = 0;
let isFetchingPromise: Promise<number> | null = null;
const listeners = new Set<(count: number) => void>();

export function setGlobalUnreadCount(count: number) {
  globalUnreadCount = Math.max(0, count);
  listeners.forEach((listener) => listener(globalUnreadCount));
}

export function decrementGlobalUnreadCount(amount: number = 1) {
  setGlobalUnreadCount(globalUnreadCount - amount);
}

export async function refreshGlobalUnreadCount(): Promise<number> {
  const now = Date.now();
  if (now - lastFetchTimestamp < 3000 && !isFetchingPromise) {
    return globalUnreadCount;
  }

  if (isFetchingPromise) {
    return isFetchingPromise;
  }

  lastFetchTimestamp = now;
  isFetchingPromise = (async () => {
    try {
      const count = await getUnreadCount();
      if (typeof count === "number") {
        setGlobalUnreadCount(count);
        return count;
      }
      return globalUnreadCount;
    } catch {
      return globalUnreadCount;
    } finally {
      isFetchingPromise = null;
    }
  })();

  return isFetchingPromise;
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(globalUnreadCount);
  const isMountedRef = useRef(true);

  const refresh = useCallback(() => {
    if (isAuthenticated) {
      refreshGlobalUnreadCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMountedRef.current = true;
    const updateLocal = (count: number) => {
      if (isMountedRef.current) {
        setUnreadCount(count);
      }
    };

    listeners.add(updateLocal);

    if (isAuthenticated) {
      refreshGlobalUnreadCount();
    }

    const handleFocus = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        refreshGlobalUnreadCount();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMountedRef.current = false;
      listeners.delete(updateLocal);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);

  return {
    unreadCount,
    refreshUnreadCount: refresh,
    setUnreadCount: setGlobalUnreadCount,
  };
}
