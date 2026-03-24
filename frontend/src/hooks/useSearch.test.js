/**
 * Tests for useSearch hook
 * Phase 3, Plan 03-01: SearchInterface Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from './useSearch.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockApiResponse = {
  results: [
    {
      id: 'entry-1',
      title: 'Q: How do we handle 1099 forms?',
      type: 'memo',
      status: 'approved',
      author: 'cromine@rhwcpas.com',
      tags: ['1099', 'forms'],
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'entry-2',
      title: 'SOP: Payroll Processing',
      type: 'sop',
      status: 'approved',
      author: 'staff@rhwcpas.com',
      tags: ['payroll', 'sop'],
      createdAt: '2026-01-10T09:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 2,
  limit: 20,
  offset: 0,
  hasMore: false,
};

function makeOkResponse(data) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  };
}

function makeErrorResponse(status, message) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  };
}

describe('useSearch hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValue(makeOkResponse(mockApiResponse));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty query and no results', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.query).toBe('');
      expect(result.current.results).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.page).toBe(1);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('starts with empty filters', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.filters).toEqual({
        status: '',
        type: '',
        tags: [],
      });
    });
  });

  describe('search behavior', () => {
    it('calls /api/search when query changes after debounce', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('1099');
      });

      // Should not call fetch immediately
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers past debounce (300ms)
      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/search');
      expect(url).toContain('q=1099');
    });

    it('does not call fetch before debounce completes', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('1099');
      });

      act(() => {
        vi.advanceTimersByTime(200); // Less than 300ms debounce
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('cancels previous debounced call when query changes quickly', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('tax');
      });

      act(() => {
        vi.advanceTimersByTime(100);
        result.current.setQuery('taxes');
      });

      act(() => {
        vi.advanceTimersByTime(100);
        result.current.setQuery('taxes 2025');
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('q=taxes+2025');
    });

    it('fetches immediately on mount with empty query to load all entries', async () => {
      const { result } = renderHook(() => useSearch());

      // Advance timers to trigger initial fetch
      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('populates results after successful fetch', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });

      expect(result.current.results[0].id).toBe('entry-1');
      expect(result.current.total).toBe(2);
    });

    it('sets loading to true during fetch', async () => {
      let resolveFetch;
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      // Loading should be true while fetch is pending
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the fetch
      act(() => {
        resolveFetch(makeOkResponse(mockApiResponse));
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('filter behavior', () => {
    it('includes status filter in API URL', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setFilters({ status: 'approved', type: '', tags: [] });
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('status=approved');
    });

    it('includes type filter in API URL', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setFilters({ status: '', type: 'memo', tags: [] });
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('type=memo');
    });

    it('includes tags filter in API URL', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setFilters({ status: '', type: '', tags: ['payroll', '1099'] });
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('tags=payroll');
      expect(url).toContain('tags=1099');
    });

    it('omits empty filters from URL', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).not.toContain('status=');
      expect(url).not.toContain('type=');
    });
  });

  describe('pagination', () => {
    it('starts on page 1', () => {
      const { result } = renderHook(() => useSearch());
      expect(result.current.page).toBe(1);
    });

    it('calls API with correct offset when page changes', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      act(() => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('offset=20');
      expect(url).toContain('limit=20');
    });

    it('resets to page 1 when query changes', async () => {
      const { result } = renderHook(() => useSearch());

      // Go to page 2
      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.page).toBe(2);

      // Change query
      act(() => {
        result.current.setQuery('new query');
      });

      expect(result.current.page).toBe(1);
    });

    it('resets to page 1 when filters change', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.page).toBe(3);

      act(() => {
        result.current.setFilters({ status: 'approved', type: '', tags: [] });
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('error handling', () => {
    it('sets error state when fetch fails with non-ok response', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500, 'Search failed'));

      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    it('sets error state when fetch throws (network error)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      expect(result.current.loading).toBe(false);
    });

    it('clears error on successful retry', async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(500, 'Server error'));
      mockFetch.mockResolvedValueOnce(makeOkResponse(mockApiResponse));

      const { result } = renderHook(() => useSearch());

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(result.current.error).not.toBe(null);
      });

      // Trigger retry via new query
      act(() => {
        result.current.setQuery('retry');
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.results).toHaveLength(2);
      });
    });
  });
});
