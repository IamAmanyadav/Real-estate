"use client";

import { useState, useEffect, useCallback } from "react";
import { getProperties } from "@/lib/api";
import type { Property, PropertyFilters, PaginatedResponse } from "@/types";

interface UsePropertiesReturn {
  properties: Property[];
  total: number;
  totalPages: number;
  page: number;
  loading: boolean;
  error: string | null;
  filters: PropertyFilters;
  setFilters: (filters: PropertyFilters) => void;
  resetFilters: () => void;
  refetch: () => void;
}

export function useProperties(
  initialFilters: PropertyFilters = {}
): UsePropertiesReturn {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: PaginatedResponse<Property> = await getProperties(filters);
      setProperties(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      setProperties([]);
      setTotal(0);
      setTotalPages(1);
      setError("Failed to load properties. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    properties,
    total,
    totalPages,
    page,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    refetch: fetchProperties,
  };
}
