/**
 * useApproval hook
 * Phase 3, Plan 03-03: ApprovalDashboard Component
 *
 * Manages state and API calls for the approval workflow:
 * - getPendingEntries: GET /api/search?status=pending
 * - approveEntry: POST /api/approveEntry
 * - selectEntry: update selected entry in local state
 * - clearActionStatus: reset action feedback
 */

import { useState, useCallback } from 'react';

const VALID_ACTIONS = ['approve', 'reject', 'request_changes'];

/**
 * Build the pending entries URL.
 * Defaults to status=pending; can be overridden via options.
 */
function buildPendingUrl(options = {}) {
  const params = new URLSearchParams();
  params.set('status', options.status || 'pending');
  params.set('limit', '50');
  params.set('offset', '0');
  return `/api/search?${params.toString()}`;
}

export function useApproval() {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  /**
   * Load pending entries from /api/search?status=pending
   * Optional options.status to override filter
   */
  const getPendingEntries = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const url = buildPendingUrl(options);
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed to load entries (${res.status})`);
        setPendingEntries([]);
        return;
      }

      const data = await res.json();
      setPendingEntries(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load entries');
      setPendingEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select an entry to view in the preview pane.
   * Pass null to deselect.
   */
  const selectEntry = useCallback((entry) => {
    setSelectedEntry(entry);
  }, []);

  /**
   * Approve, reject, or request changes on an entry.
   * @param {string} entryId - The entry's ID
   * @param {string} action - One of: approve | reject | request_changes
   * @param {string} [notes] - Optional notes for the action
   */
  const approveEntry = useCallback(async (entryId, action, notes) => {
    // Client-side validation
    if (!VALID_ACTIONS.includes(action)) {
      setError(`Invalid action: "${action}". Must be one of: ${VALID_ACTIONS.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);
    setActionStatus(null);

    try {
      const body = { entryId, action };
      if (notes) body.notes = notes;

      const res = await fetch('/api/approveEntry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Action failed (${res.status})`);
        return;
      }

      // Clear selection if we just acted on the selected entry
      setSelectedEntry((prev) => (prev && prev.id === entryId ? null : prev));

      // Set success feedback
      const actionLabel = action === 'approve'
        ? 'approved'
        : action === 'reject'
        ? 'rejected'
        : 'flagged for changes';
      setActionStatus({ type: 'success', message: `Entry ${actionLabel} successfully.` });

      // Refresh the pending list
      await getPendingEntries();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }, [getPendingEntries]);

  /**
   * Clear the action status feedback (success/error banner).
   */
  const clearActionStatus = useCallback(() => {
    setActionStatus(null);
  }, []);

  return {
    pendingEntries,
    selectedEntry,
    loading,
    error,
    actionStatus,
    getPendingEntries,
    approveEntry,
    selectEntry,
    clearActionStatus,
  };
}

export default useApproval;
