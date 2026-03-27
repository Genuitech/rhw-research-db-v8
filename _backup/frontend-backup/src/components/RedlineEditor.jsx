/**
 * RedlineEditor component
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 *
 * Side-by-side diff editor for tracking edits with green/red highlights.
 * Original text on left, live diff preview on right.
 * Submits edited version to /api/submitEntry for re-approval.
 *
 * Security note: dangerouslySetInnerHTML is used ONLY with output from
 * formatRedlineHTML(), which HTML-escapes all user content before wrapping
 * in <ins>/<del>/<span> tags. No raw user input reaches the DOM as HTML.
 */

import { useState, useEffect, useMemo } from 'react';
import useEntries from '../hooks/useEntries.js';
import { calculateDiff, formatRedlineHTML } from '../utils/redlineUtil.js';
import styles from './RedlineEditor.module.css';

export default function RedlineEditor({ entry, onCancel, onSubmitted }) {
  const { submitEntry, loading, error, successMessage, clearStatus } = useEntries();

  const [editedMemo, setEditedMemo] = useState(entry?.memo || '');
  const [noChangesWarning, setNoChangesWarning] = useState(false);

  // Trigger onSubmitted callback when submission succeeds
  useEffect(() => {
    if (successMessage && onSubmitted) {
      onSubmitted();
    }
  }, [successMessage, onSubmitted]);

  function handleMemoChange(e) {
    setEditedMemo(e.target.value);
    setNoChangesWarning(false);
    if (error || successMessage) {
      clearStatus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Check for no changes
    if (editedMemo.trim() === (entry?.memo || '').trim()) {
      setNoChangesWarning(true);
      return;
    }

    setNoChangesWarning(false);

    await submitEntry({
      type: entry.type,
      clientName: entry.clientName,
      question: entry.question,
      memo: editedMemo,
      tags: entry.tags || [],
      conversation: entry.conversation || '',
      originalEntryId: entry.id,
    });
  }

  // Compute the diff for the live preview
  const diff = useMemo(
    () => calculateDiff(entry?.memo || '', editedMemo),
    [entry?.memo, editedMemo]
  );

  // formatRedlineHTML escapes all user text before injecting into HTML tags — safe to render
  const diffHTML = useMemo(() => {
    const html = formatRedlineHTML(diff);
    // Fallback: if no diff yet, render original as escaped equal span
    if (!html && entry?.memo) {
      return formatRedlineHTML([{ type: 'equal', text: entry.memo }]);
    }
    return html;
  }, [diff, entry?.memo]);

  return (
    <section
      className={styles.root}
      aria-label="Redline Editor"
      role="region"
    >
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Edit Entry</h2>
          {entry && (
            <p className={styles.subtitle}>{entry.title}</p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorIcon}>&#9888;</span>
          <span>Submission failed. Please try again. {error}</span>
        </div>
      )}

      {/* No changes warning */}
      {noChangesWarning && (
        <div className={styles.warningBanner} role="status">
          <span>No changes detected. Please edit the memo before submitting.</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={styles.form}
        aria-label="Edit and submit entry"
      >
        {/* Two-panel layout: edit area + diff preview */}
        <div className={styles.panels}>
          {/* Left panel: edit textarea */}
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelLabel}>Your Changes</h3>
            <textarea
              className={`glass-input ${styles.editArea}`}
              value={editedMemo}
              onChange={handleMemoChange}
              aria-label="Edit memo content"
              rows={12}
              placeholder="Edit the memo content here..."
              disabled={loading}
            />
          </div>

          {/* Right panel: diff preview — content is HTML-escaped by formatRedlineHTML */}
          <div className={`glass ${styles.panel}`}>
            <h3 className={styles.panelLabel}>Preview Changes</h3>
            {/* Content safety: formatRedlineHTML escapes all text via escapeHtml() before
                wrapping in structural <ins>/<del>/<span> tags. No raw user text reaches innerHTML. */}
            <div
              className={styles.diffArea}
              dangerouslySetInnerHTML={{ __html: diffHTML }}
              aria-label="Diff preview"
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={`glass-button ${styles.cancelBtn}`}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`glass-button ${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Re-Approval'}
          </button>
        </div>
      </form>
    </section>
  );
}
