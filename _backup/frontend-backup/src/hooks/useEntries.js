/**
 * useEntries hook — API integration for research entry submission and retrieval.
 * submitEntry: POST to /api/submitEntry
 * getEntry: GET from /api/entry/{id}
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
      setSuccessMessage('Entry submitted successfully and is pending review.');
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
