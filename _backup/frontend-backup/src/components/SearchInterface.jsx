/**
 * SearchInterface component
 * Phase 3, Plan 03-01: SearchInterface Component
 *
 * Main search UI with filters, results grid, pagination, and state handling.
 * Uses liquid glass design from globals.css.
 */

import { useSearch } from '../hooks/useSearch.js';
import styles from './SearchInterface.module.css';

const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'memo', label: 'Memo' },
  { value: 'sop', label: 'SOP' },
  { value: 'policy', label: 'Policy' },
];

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

function EntryCard({ entry }) {
  const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`glass ${styles.card}`}>
      <div className={styles.cardHeader}>
        <TypeBadge type={entry.type} />
        <StatusBadge status={entry.status} />
      </div>

      <h3 className={styles.cardTitle}>{entry.title}</h3>

      {entry.client && (
        <p className={styles.cardClient}>{entry.client}</p>
      )}

      <div className={styles.cardMeta}>
        <span className={styles.cardAuthor}>{entry.author}</span>
        <span className={styles.cardDate}>{date}</span>
      </div>

      {entry.tags && entry.tags.length > 0 && (
        <div className={styles.cardTags}>
          {entry.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.centerState}>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.stateText}>Loading results...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className={`glass ${styles.errorState}`}>
      <p className={styles.errorText}>{message}</p>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className={styles.centerState}>
      <p className={styles.stateText}>
        {query
          ? `No results found for "${query}"`
          : 'No results found. Try adjusting your search or filters.'}
      </p>
    </div>
  );
}

function Pagination({ page, total, onPrev, onNext }) {
  const totalPages = Math.ceil(total / LIMIT);

  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        className={`glass-button ${styles.pageBtn}`}
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        Prev
      </button>

      <span className={styles.pageIndicator}>
        Page {page} of {totalPages}
      </span>

      <button
        className={`glass-button ${styles.pageBtn}`}
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

export default function SearchInterface() {
  const {
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
  } = useSearch();

  function handleQueryChange(e) {
    setQuery(e.target.value);
  }

  function handleStatusChange(e) {
    setFilters({ ...filters, status: e.target.value });
  }

  function handleTypeChange(e) {
    setFilters({ ...filters, type: e.target.value });
  }

  function handlePrev() {
    goToPage(page - 1);
  }

  function handleNext() {
    goToPage(page + 1);
  }

  return (
    <div className={styles.root}>
      {/* Search bar */}
      <div className={`glass ${styles.searchBar}`}>
        <input
          type="text"
          className={`glass-input ${styles.searchInput}`}
          placeholder="Search memos, SOPs, policies, Q&A..."
          value={query}
          onChange={handleQueryChange}
          aria-label="Search"
        />
      </div>

      <div className={styles.layout}>
        {/* Filter sidebar */}
        <aside className={`glass ${styles.sidebar}`}>
          <h2 className={styles.sidebarTitle}>Filters</h2>

          <div className={styles.filterGroup}>
            <label htmlFor="filter-status" className={styles.filterLabel}>
              Status
            </label>
            <select
              id="filter-status"
              className={`glass-input ${styles.filterSelect}`}
              value={filters.status}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filter-type" className={styles.filterLabel}>
              Type
            </label>
            <select
              id="filter-type"
              className={`glass-input ${styles.filterSelect}`}
              value={filters.type}
              onChange={handleTypeChange}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {total > 0 && !loading && !error && (
            <p className={styles.resultCount}>
              {total} result{total !== 1 ? 's' : ''}
            </p>
          )}
        </aside>

        {/* Results area */}
        <main className={styles.resultsArea}>
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && results.length === 0 && (
            <EmptyState query={query} />
          )}
          {!loading && !error && results.length > 0 && (
            <>
              <div className={styles.grid}>
                {results.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
              <Pagination
                page={page}
                total={total}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
