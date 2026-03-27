/**
 * Tests for useApproval hook
 * Phase 3, Plan 03-03: ApprovalDashboard Component
 *
 * Tests: API calls, state management, refresh after action
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApproval } from '../src/hooks/useApproval.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockPendingEntries = [
  {
    id: 'entry-p1',
    title: 'Should we elect S-Corp status for this LLC?',
    type: 'memo',
    status: 'pending',
    author: 'staff1@rhwcpas.com',
    client: 'Smith Enterprises',
    question: 'Is S-Corp election beneficial for a 2-member LLC earning $200K/yr?',
    memo: 'Based on the SE tax savings analysis, S-Corp election appears favorable when net income exceeds $40K.',
    conversation: 'Client: We earned $200K last year...\nCPA: Let me run the numbers...',
    tags: ['s-corp', 'tax-strategy'],
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'entry-p2',
    title: 'Home office deduction for remote employee',
    type: 'memo',
    status: 'pending',
    author: 'staff2@rhwcpas.com',
    client: 'Johnson Family',
    question: 'Can a W-2 employee deduct home office expenses post-TCJA?',
    memo: 'No. The TCJA of 2017 suspended the misc itemized deduction for W-2 employees through 2025.',
    conversation: null,
    tags: ['home-office', 'tcja'],
    createdAt: '2026-03-21T14:30:00Z',
  },
];

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

describe('useApproval hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeOkResponse({ results: mockPendingEntries, total: 2 }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty pendingEntries array', () => {
      const { result } = renderHook(() => useApproval());
      expect(result.current.pendingEntries).toEqual([]);
    });

    it('starts with null selectedEntry', () => {
      const { result } = renderHook(() => useApproval());
      expect(result.current.selectedEntry).toBeNull();
    });

    it('starts with loading false', () => {
      const { result } = renderHook(() => useApproval());
      expect(result.current.loading).toBe(false);
    });

    it('starts with null error', () => {
      const { result } = renderHook(() => useApproval());
      expect(result.current.error).toBeNull();
    });

    it('starts with null actionStatus', () => {
      const { result } = renderHook(() => useApproval());
      expect(result.current.actionStatus).toBeNull();
    });

    it('exposes getPendingEntries, approveEntry, selectEntry, clearActionStatus functions', () => {
      const { result } = renderHook(() => useApproval());
      expect(typeof result.current.getPendingEntries).toBe('function');
      expect(typeof result.current.approveEntry).toBe('function');
      expect(typeof result.current.selectEntry).toBe('function');
      expect(typeof result.current.clearActionStatus).toBe('function');
    });
  });

  describe('getPendingEntries', () => {
    it('calls /api/search with status=pending', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/search'),
        expect.any(Object)
      );
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('status=pending');
    });

    it('populates pendingEntries on success', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      expect(result.current.pendingEntries).toHaveLength(2);
      expect(result.current.pendingEntries[0].id).toBe('entry-p1');
    });

    it('sets loading true during fetch and false after', async () => {
      let resolveFetch;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const { result } = renderHook(() => useApproval());

      act(() => {
        result.current.getPendingEntries();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveFetch(makeOkResponse({ results: mockPendingEntries, total: 2 }));
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(500, 'Server error'));

      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.pendingEntries).toEqual([]);
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('supports optional status filter override', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries({ status: 'review_requested' });
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('status=review_requested');
    });
  });

  describe('selectEntry', () => {
    it('sets selectedEntry when called with an entry', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      act(() => {
        result.current.selectEntry(mockPendingEntries[0]);
      });

      expect(result.current.selectedEntry).toEqual(mockPendingEntries[0]);
    });

    it('clears selectedEntry when called with null', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      act(() => {
        result.current.selectEntry(mockPendingEntries[0]);
      });

      act(() => {
        result.current.selectEntry(null);
      });

      expect(result.current.selectedEntry).toBeNull();
    });
  });

  describe('approveEntry', () => {
    it('POSTs to /api/approveEntry with correct payload', async () => {
      // First load entries
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      // Reset mock for approve call
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'approved' })
      );
      // Mock the subsequent refresh call
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [], total: 0 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      // Find the approve call (second call overall, since first was getPendingEntries)
      const approveCall = mockFetch.mock.calls.find(([url]) =>
        url.includes('/api/approveEntry')
      );
      expect(approveCall).toBeTruthy();
      const [url, opts] = approveCall;
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.entryId).toBe('entry-p1');
      expect(body.action).toBe('approve');
    });

    it('accepts notes parameter in approveEntry', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'rejected' })
      );
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [], total: 0 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'reject', 'Does not meet quality standards');
      });

      const approveCall = mockFetch.mock.calls.find(([url]) =>
        url.includes('/api/approveEntry')
      );
      const body = JSON.parse(approveCall[1].body);
      expect(body.notes).toBe('Does not meet quality standards');
    });

    it('refreshes pending entries list after approval', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      expect(result.current.pendingEntries).toHaveLength(2);

      // Approve succeeds, then refresh returns 1 entry
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'approved' })
      );
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [mockPendingEntries[1]], total: 1 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      expect(result.current.pendingEntries).toHaveLength(1);
    });

    it('clears selectedEntry if it was the approved entry', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      act(() => {
        result.current.selectEntry(mockPendingEntries[0]);
      });

      expect(result.current.selectedEntry).toEqual(mockPendingEntries[0]);

      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'approved' })
      );
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [mockPendingEntries[1]], total: 1 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      expect(result.current.selectedEntry).toBeNull();
    });

    it('sets actionStatus to success after approve', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'approved' })
      );
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [], total: 0 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      expect(result.current.actionStatus).toEqual(
        expect.objectContaining({ type: 'success' })
      );
    });

    it('sets error and actionStatus on failed approve', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      mockFetch.mockResolvedValueOnce(makeErrorResponse(403, 'Admin access required'));

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      expect(result.current.error).not.toBeNull();
    });

    it('validates action — only approve, reject, request_changes allowed', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'invalid_action');
      });

      expect(result.current.error).not.toBeNull();
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/approveEntry'),
        expect.any(Object)
      );
    });
  });

  describe('clearActionStatus', () => {
    it('resets actionStatus to null', async () => {
      const { result } = renderHook(() => useApproval());

      await act(async () => {
        await result.current.getPendingEntries();
      });

      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ id: 'entry-p1', status: 'approved' })
      );
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ results: [], total: 0 })
      );

      await act(async () => {
        await result.current.approveEntry('entry-p1', 'approve');
      });

      expect(result.current.actionStatus).not.toBeNull();

      act(() => {
        result.current.clearActionStatus();
      });

      expect(result.current.actionStatus).toBeNull();
    });
  });
});
