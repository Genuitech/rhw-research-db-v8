/**
 * useSearch hook
 * Phase 3, Plan 03-01: SearchInterface Component
 *
 * Manages search state, API calls, debouncing, filters, and pagination
 * for the /api/search endpoint.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const LIMIT = 20;
const DEBOUNCE_MS = 300;

/**
 * Build the search URL with query params, omitting empty values.
 */
function buildSearchUrl(query, filters, page) {
  const offset = (page - 1) * LIMIT;
  const params = new URLSearchParams();

  if (query && query.trim()) {
    params.set('q', query.trim());
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.type) {
    params.set('type', filters.type);
  }

  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => params.append('tags', tag));
  }

  params.set('limit', String(LIMIT));
  params.set('offset', String(offset));

  return `/api/search?${params.toString()}`;
}

export function useSearch() {
  const [query, setQueryState] = useState('');
  const [filters, setFiltersState] = useState({ status: '', type: '', tags: [] });
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref to track the active fetch so we can ignore stale responses
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  /**
   * Execute the search against /api/search
   */
  const executeSearch = useCallback(async (q, f, p) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const url = buildSearchUrl(q, f, p);
      const res = await fetch(url, { signal: abortControllerRef.current.signal });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Search failed (${res.status})`);
        setResults([]);
        return;
      }

      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      // Ignore abort errors — they're intentional
      if (err.name === 'AbortError') return;
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Debounced effect: fires executeSearch after DEBOUNCE_MS of quiet time.
   * Triggered by query, filters, or page changes.
   */
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(query, filters, page);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, filters, page, executeSearch]);

  /**
   * Update query and reset to page 1.
   */
  const setQuery = useCallback((q) => {
    setQueryState(q);
    setPage(1);
  }, []);

  /**
   * Update filters and reset to page 1.
   */
  const setFilters = useCallback((f) => {
    setFiltersState(f);
    setPage(1);
  }, []);

  /**
   * Navigate to a specific page.
   */
  const goToPage = useCallback((p) => {
    setPage(p);
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    page,
    goToPage,
    results,
    total,
    loading,
    error,
  };
}

export default useSearch;
