"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "luxe_saved_properties";
const EVENT_NAME = "luxe_saved_properties_updated";

export function getSavedPropertyIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedPropertyId(id: string): string[] {
  if (typeof window === "undefined") return [];
  const current = getSavedPropertyIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
  } catch (err) {
    console.error("Failed to save property to localStorage:", err);
  }
  return updated;
}

export function isPropertySaved(id: string): boolean {
  return getSavedPropertyIds().includes(id);
}

export function useSavedProperties() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(getSavedPropertyIds());

    const handleUpdate = (e: CustomEvent<string[]>) => {
      setSavedIds(e.detail || getSavedPropertyIds());
    };

    window.addEventListener(EVENT_NAME as any, handleUpdate);
    return () => window.removeEventListener(EVENT_NAME as any, handleUpdate);
  }, []);

  const toggleSave = useCallback((id: string) => {
    const updated = toggleSavedPropertyId(id);
    setSavedIds(updated);
  }, []);

  const checkIsSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  return {
    savedIds,
    savedCount: savedIds.length,
    toggleSave,
    isSaved: checkIsSaved,
  };
}
