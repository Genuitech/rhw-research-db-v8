/**
 * ApprovalDashboard component
 * Phase 3, Plan 03-03: ApprovalDashboard Component
 *
 * Admin dashboard for reviewing and approving/rejecting pending entries.
 * Features:
 * - Pending entries list with card previews
 * - Detail preview pane (right side on desktop, stacked on mobile)
 * - Approve / Reject / Request Changes action buttons (admin only)
 * - Role-based access: conversation transcript hidden from non-admin
 * - Loading, error, and empty states
 * - Success/error feedback after actions
 * - Liquid glass dark theme via CSS Modules + global glass utilities
 */

import { useEffect } from 'react';
import { useApproval } from '../hooks/useApproval.js';
import styles from './ApprovalDashboard.module.css';

/** Format an ISO date string as "Jan 1, 2026" */
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Loading spinner */
function LoadingState() {
  return (
    <div className={styles.centerState}>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.stateText}>Loading pending entries...</p>
    </div>
  );
}

/** Full-panel error */
function ErrorState({ message }) {
  return (
    <div className={`glass ${styles.errorBanner}`} role="alert">
      <span className={styles.errorIcon}>&#9888;</span>
      <span>{message}</span>
    </div>
  );
}

/** Empty list */
function EmptyState() {
  return (
    <div className={styles.centerState}>
      <p className={styles.stateText}>No pending entries. Check back later.</p>
    </div>
  );
}

/** Single entry card in the list */
function EntryCard({ entry, isSelected, onSelect }) {
  return (
    <article
      className={`glass ${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={() => onSelect(entry)}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(entry)}
      aria-selected={isSelected}
      aria-label={`Pending entry: ${entry.title}`}
    >
      <h3 className={styles.cardTitle}>{entry.title}</h3>
      {entry.client && (
        <p className={styles.cardClient}>{entry.client}</p>
      )}
      <div className={styles.cardMeta}>
        <span className={styles.cardAuthor}>{entry.author}</span>
        <span className={styles.cardDate}>{formatDate(entry.createdAt)}</span>
      </div>
    </article>
  );
}

/** Preview pane: full entry detail */
function PreviewPane({ entry, isAdmin, onApprove, loading }) {
  if (!entry) {
    return (
      <div className={`glass ${styles.previewEmpty}`}>
        <p className={styles.stateText}>Select an entry to review it.</p>
      </div>
    );
  }

  return (
    <div className={`glass ${styles.preview}`}>
      {/* Entry header */}
      <div className={styles.previewHeader}>
        <h2 className={styles.previewTitle}>{entry.title}</h2>
        <div className={styles.previewMeta}>
          <span className={styles.previewMetaItem}>
            <span className={styles.metaLabel}>Client:</span> {entry.client || '—'}
          </span>
          <span className={styles.previewMetaItem}>
            <span className={styles.metaLabel}>Author:</span> {entry.author}
          </span>
          <span className={styles.previewMetaItem}>
            <span className={styles.metaLabel}>Submitted:</span> {formatDate(entry.createdAt)}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Question / Topic</h3>
        <p className={styles.sectionBody}>{entry.question}</p>
      </div>

      {/* Memo */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Memo / Answer</h3>
        <p className={styles.sectionBody}>{entry.memo}</p>
      </div>

      {/* Conversation — admin only */}
      {isAdmin && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Conversation Transcript</h3>
          {entry.conversation ? (
            <pre className={styles.conversation}>{entry.conversation}</pre>
          ) : (
            <p className={styles.stateText}>No conversation transcript attached.</p>
          )}
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className={styles.tagRow}>
          {entry.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Action buttons — admin only */}
      {isAdmin && (
        <div className={styles.actions}>
          <button
            className={`glass-button ${styles.actionBtn} ${styles.approveBtn}`}
            onClick={() => onApprove(entry.id, 'approve')}
            disabled={loading}
            aria-label="Approve this entry"
          >
            Approve
          </button>
          <button
            className={`glass-button ${styles.actionBtn} ${styles.rejectBtn}`}
            onClick={() => onApprove(entry.id, 'reject')}
            disabled={loading}
            aria-label="Reject this entry"
          >
            Reject
          </button>
          <button
            className={`glass-button ${styles.actionBtn} ${styles.changesBtn}`}
            onClick={() => onApprove(entry.id, 'request_changes')}
            disabled={loading}
            aria-label="Request changes for this entry"
          >
            Request Changes
          </button>
        </div>
      )}
    </div>
  );
}

export default function ApprovalDashboard({ isAdmin = false }) {
  const {
    pendingEntries,
    selectedEntry,
    loading,
    error,
    actionStatus,
    getPendingEntries,
    approveEntry,
    selectEntry,
    clearActionStatus,
  } = useApproval();

  // Load pending entries on mount
  useEffect(() => {
    getPendingEntries();
  }, [getPendingEntries]);

  function handleApprove(entryId, action, notes) {
    approveEntry(entryId, action, notes);
  }

  return (
    <main className={styles.root} role="main">
      {/* Page header */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Approval Dashboard</h1>
        {!loading && !error && (
          <span className={styles.countBadge}>
            {pendingEntries.length} pending
          </span>
        )}
      </div>

      {/* Action status banner */}
      {actionStatus && actionStatus.type === 'success' && (
        <div
          className={styles.successBanner}
          role="status"
          onClick={clearActionStatus}
        >
          <span className={styles.successIcon}>&#10003;</span>
          <span>{actionStatus.message}</span>
        </div>
      )}

      {/* Error banner (action errors) */}
      {error && (
        <div className={`glass ${styles.errorBanner}`} role="alert">
          <span className={styles.errorIcon}>&#9888;</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main content area */}
      {loading && !pendingEntries.length ? (
        <LoadingState />
      ) : (
        <div className={styles.layout}>
          {/* Left: entry list */}
          <aside className={styles.listPane}>
            {pendingEntries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className={styles.list}>
                {pendingEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntry && selectedEntry.id === entry.id}
                    onSelect={selectEntry}
                  />
                ))}
              </div>
            )}
          </aside>

          {/* Right: preview pane */}
          <section className={styles.previewPane}>
            <PreviewPane
              entry={selectedEntry}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              loading={loading}
            />
          </section>
        </div>
      )}
    </main>
  );
}
