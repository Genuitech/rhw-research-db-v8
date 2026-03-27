import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useEntries from '../src/hooks/useEntries.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const validFormData = {
  type: 'memo',
  clientName: 'Test Client LLC',
  question: 'Can we deduct home office expenses for a sole proprietor?',
  memo: 'Yes, sole proprietors can deduct home office expenses using Form 8829 if the space is used regularly and exclusively for business.',
  tags: ['home office', 'deductions', 'sole proprietor'],
  conversation: '',
};

describe('useEntries hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with null currentEntry, no loading, no error, no success', () => {
      const { result } = renderHook(() => useEntries());
      expect(result.current.currentEntry).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.successMessage).toBeNull();
    });

    it('exposes submitEntry and getEntry functions', () => {
      const { result } = renderHook(() => useEntries());
      expect(typeof result.current.submitEntry).toBe('function');
      expect(typeof result.current.getEntry).toBe('function');
    });
  });

  describe('submitEntry', () => {
    it('sets loading true during request', async () => {
      let resolvePromise;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useEntries());

      act(() => {
        result.current.submitEntry(validFormData);
      });

      expect(result.current.loading).toBe(true);

      // Resolve the request
      await act(async () => {
        resolvePromise({ ok: true, json: async () => ({ id: 'abc123', status: 'pending_review' }) });
      });
    });

    it('POSTs to /api/submitEntry with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'abc123', status: 'pending_review' }),
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.submitEntry(validFormData);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/submitEntry',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.type).toBe('memo');
      expect(body.clientName).toBe('Test Client LLC');
    });

    it('sets successMessage and currentEntry on success', async () => {
      const responseEntry = { id: 'abc123', status: 'pending_review' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseEntry,
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.submitEntry(validFormData);
      });

      expect(result.current.successMessage).toBeTruthy();
      expect(result.current.currentEntry).toEqual(responseEntry);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('sets error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed' }),
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.submitEntry(validFormData);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.successMessage).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.submitEntry(validFormData);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });

    it('clears previous error and success before new request', async () => {
      // First request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'abc123', status: 'pending_review' }),
      });

      const { result } = renderHook(() => useEntries());
      await act(async () => {
        await result.current.submitEntry(validFormData);
      });
      expect(result.current.successMessage).toBeTruthy();

      // Second request — error is cleared during fetch
      let resolveSecond;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => { resolveSecond = resolve; })
      );

      act(() => {
        result.current.submitEntry(validFormData);
      });

      // While loading, previous success is cleared
      expect(result.current.error).toBeNull();

      await act(async () => {
        resolveSecond({ ok: true, json: async () => ({ id: 'def456', status: 'pending_review' }) });
      });
    });

    it('returns the entry data on success', async () => {
      const responseEntry = { id: 'abc123', status: 'pending_review' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseEntry,
      });

      const { result } = renderHook(() => useEntries());
      let returnValue;

      await act(async () => {
        returnValue = await result.current.submitEntry(validFormData);
      });

      expect(returnValue).toEqual(responseEntry);
    });
  });

  describe('getEntry', () => {
    it('GETs from /api/entry/{id}', async () => {
      const entryData = { id: 'abc123', type: 'memo', status: 'approved' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => entryData,
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.getEntry('abc123');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/entry/abc123', expect.any(Object));
      expect(result.current.currentEntry).toEqual(entryData);
      expect(result.current.loading).toBe(false);
    });

    it('sets error on getEntry failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.getEntry('nonexistent');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('sets loading true during getEntry', async () => {
      let resolvePromise;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() => useEntries());

      act(() => {
        result.current.getEntry('abc123');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ ok: true, json: async () => ({ id: 'abc123' }) });
      });
    });
  });

  describe('clearStatus', () => {
    it('exposes clearStatus function to reset error and success', () => {
      const { result } = renderHook(() => useEntries());
      expect(typeof result.current.clearStatus).toBe('function');
    });

    it('clearStatus resets error and successMessage to null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useEntries());

      await act(async () => {
        await result.current.submitEntry(validFormData);
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearStatus();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.successMessage).toBeNull();
    });
  });
});
