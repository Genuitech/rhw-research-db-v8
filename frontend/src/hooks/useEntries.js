/**
 * useEntries hook — stub for plan 03-02
 * Will be fully implemented in the next plan.
 */

import { useState } from 'react';

export default function useEntries() {
  const [currentEntry, setCurrentEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  async function submitEntry(formData) {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/submitEntry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
        return null;
      }
      setCurrentEntry(data);
      setSuccessMessage('Entry submitted successfully.');
      return data;
    } catch (err) {
      setError(err.message || 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function getEntry(id) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entry/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch entry');
        return null;
      }
      setCurrentEntry(data);
      return data;
    } catch (err) {
      setError(err.message || 'Network error');
      return null;
    } finally {
      setLoading(false);
    }
  }

  function clearStatus() {
    setError(null);
    setSuccessMessage(null);
  }

  return { currentEntry, loading, error, successMessage, submitEntry, getEntry, clearStatus };
}
