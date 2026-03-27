/**
 * EntryViewer component
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 *
 * Displays a single research entry with full details and approval history.
 * Provides an Edit button to open the RedlineEditor.
 */

import { useEffect } from 'react';
import useEntries from '../hooks/useEntries.js';
import styles from './EntryViewer.module.css';

function StatusBadge({ status }) {
  const colorMap = {
    approved: styles.badgeApproved,
    pending: styles.badgePending,
    rejected: styles.badgeRejected,
  };
  return (
    <span className={`${styles.badge} ${colorMap[status] || styles.badgeDefault}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  const colorMap = {
    memo: styles.badgeMemo,
    sop: styles.badgeSop,
    policy: styles.badgePolicy,
  };
  return (
    <span className={`${styles.badge} ${colorMap[type] || styles.badgeDefault}`}>
      {type}
    </span>
  );
}

function ApprovalHistoryItem({ item }) {
  const date = new Date(item.at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const actionColorMap = {
    approved: styles.historyApproved,
    rejected: styles.historyRejected,
    submitted: styles.historySubmitted,
    resubmitted: styles.historySubmitted,
  };

  return (
    <li className={styles.historyItem}>
      <span className={`${styles.historyAction} ${actionColorMap[item.action] || ''}`}>
        {item.action}
      </span>
      <span className={styles.historyBy}>{item.by}</span>
      <span className={styles.historyAt}>{date}</span>
      {item.note && <span className={styles.historyNote}>{item.note}</span>}
    </li>
  );
}

export default function EntryViewer({ entryId, onBack, onEdit }) {
  const { getEntry, currentEntry: entry, loading, error } = useEntries();

  useEffect(() => {
    if (entryId) {
      getEntry(entryId);
    }
  }, [entryId]);

  const formattedDate = entry
    ? new Date(entry.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className={styles.root}>
      {/* Breadcrumb / back navigation */}
      <div className={styles.nav}>
        <button
          type="button"
          className={`glass-button ${styles.backBtn}`}
          onClick={onBack}
          aria-label="Back to search"
        >
          &larr; Back
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className={styles.centerState}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.stateText}>Loading entry...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className={`glass ${styles.errorState}`}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Entry content */}
      {!loading && !error && entry && (
        <article className={`glass glow-sky ${styles.card}`}>
          {/* Header: badges + actions */}
          <div className={styles.cardHeader}>
            <div className={styles.badgeRow}>
              <TypeBadge type={entry.type} />
              <StatusBadge status={entry.status} />
            </div>
            <div className={styles.actions}>
              {onEdit && (
                <button
                  type="button"
                  className={`glass-button ${styles.editBtn}`}
                  onClick={() => onEdit(entry)}
                  aria-label="Edit this entry"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className={styles.title}>{entry.title}</h1>

          {/* Meta row: client, author, date */}
          <div className={styles.metaRow}>
            {entry.clientName && (
              <span className={styles.metaClient}>{entry.clientName}</span>
            )}
            <span className={styles.metaAuthor}>{entry.author}</span>
            <span className={styles.metaDate}>{formattedDate}</span>
          </div>

          {/* Question / Topic */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Question / Topic</h2>
            <p className={styles.sectionText}>{entry.question}</p>
          </section>

          {/* Memo / Answer */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Memo / Answer</h2>
            <p className={styles.sectionText}>{entry.memo}</p>
          </section>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionLabel}>Tags</h2>
              <div className={styles.tagList}>
                {entry.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </section>
          )}

          {/* Approval History */}
          <section className={styles.section}>
            <h2 className={styles.sectionLabel}>Approval History</h2>
            {entry.approvalHistory && entry.approvalHistory.length > 0 ? (
              <ul className={styles.historyList}>
                {entry.approvalHistory.map((item, idx) => (
                  <ApprovalHistoryItem key={idx} item={item} />
                ))}
              </ul>
            ) : (
              <p className={styles.historyEmpty}>No approval history yet.</p>
            )}
          </section>
        </article>
      )}
    </div>
  );
}
