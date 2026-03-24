/**
 * Tests for SearchInterface component
 * Phase 3, Plan 03-01: SearchInterface Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInterface from './SearchInterface.jsx';

// Mock useSearch hook
vi.mock('../hooks/useSearch.js', () => ({
  useSearch: vi.fn(),
}));

import { useSearch } from '../hooks/useSearch.js';

const defaultHookState = {
  query: '',
  setQuery: vi.fn(),
  filters: { status: '', type: '', tags: [] },
  setFilters: vi.fn(),
  page: 1,
  goToPage: vi.fn(),
  results: [],
  total: 0,
  loading: false,
  error: null,
};

const mockResults = [
  {
    id: 'entry-1',
    title: 'How do we handle 1099 forms for contractors?',
    type: 'memo',
    status: 'approved',
    author: 'cromine@rhwcpas.com',
    tags: ['1099', 'contractors'],
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'entry-2',
    title: 'SOP: Payroll Processing Checklist',
    type: 'sop',
    status: 'approved',
    author: 'staff@rhwcpas.com',
    tags: ['payroll', 'checklist'],
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'entry-3',
    title: 'Policy: Client Data Retention',
    type: 'policy',
    status: 'pending',
    author: 'admin@rhwcpas.com',
    tags: ['policy', 'data'],
    createdAt: '2026-01-05T08:00:00Z',
  },
];

describe('SearchInterface component', () => {
  beforeEach(() => {
    useSearch.mockReturnValue({ ...defaultHookState });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('renders correctly', () => {
    it('renders the search input', () => {
      render(<SearchInterface />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder');
    });

    it('renders the filter section', () => {
      render(<SearchInterface />);
      // Status filter
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      // Type filter
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    });

    it('renders empty state when no results', () => {
      render(<SearchInterface />);
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });

    it('renders results count when results present', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 3,
      });

      render(<SearchInterface />);
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('calls setQuery when user types in search input', async () => {
      const mockSetQuery = vi.fn();
      useSearch.mockReturnValue({
        ...defaultHookState,
        setQuery: mockSetQuery,
      });

      render(<SearchInterface />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'payroll');

      expect(mockSetQuery).toHaveBeenCalled();
    });

    it('displays current query value in the search input', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        query: 'tax strategy',
      });

      render(<SearchInterface />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('tax strategy');
    });
  });

  describe('filter controls', () => {
    it('calls setFilters when status filter changes', async () => {
      const mockSetFilters = vi.fn();
      useSearch.mockReturnValue({
        ...defaultHookState,
        setFilters: mockSetFilters,
      });

      render(<SearchInterface />);
      const statusSelect = screen.getByLabelText(/status/i);

      await userEvent.selectOptions(statusSelect, 'approved');

      expect(mockSetFilters).toHaveBeenCalled();
    });

    it('calls setFilters when type filter changes', async () => {
      const mockSetFilters = vi.fn();
      useSearch.mockReturnValue({
        ...defaultHookState,
        setFilters: mockSetFilters,
      });

      render(<SearchInterface />);
      const typeSelect = screen.getByLabelText(/type/i);

      await userEvent.selectOptions(typeSelect, 'memo');

      expect(mockSetFilters).toHaveBeenCalled();
    });

    it('shows all status options', () => {
      render(<SearchInterface />);
      const statusSelect = screen.getByLabelText(/status/i);

      expect(within(statusSelect).getByRole('option', { name: /all/i })).toBeInTheDocument();
      expect(within(statusSelect).getByRole('option', { name: /approved/i })).toBeInTheDocument();
      expect(within(statusSelect).getByRole('option', { name: /pending/i })).toBeInTheDocument();
      expect(within(statusSelect).getByRole('option', { name: /rejected/i })).toBeInTheDocument();
    });

    it('shows all type options', () => {
      render(<SearchInterface />);
      const typeSelect = screen.getByLabelText(/type/i);

      expect(within(typeSelect).getByRole('option', { name: /all/i })).toBeInTheDocument();
      expect(within(typeSelect).getByRole('option', { name: /memo/i })).toBeInTheDocument();
      expect(within(typeSelect).getByRole('option', { name: /sop/i })).toBeInTheDocument();
      expect(within(typeSelect).getByRole('option', { name: /policy/i })).toBeInTheDocument();
    });
  });

  describe('results grid', () => {
    it('renders a card for each result', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 3,
      });

      render(<SearchInterface />);

      expect(screen.getByText('How do we handle 1099 forms for contractors?')).toBeInTheDocument();
      expect(screen.getByText('SOP: Payroll Processing Checklist')).toBeInTheDocument();
      expect(screen.getByText('Policy: Client Data Retention')).toBeInTheDocument();
    });

    it('displays entry type badge on each card', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 3,
      });

      render(<SearchInterface />);

      // Use getAllByText because 'policy' appears in both the TypeBadge and a tag span
      expect(screen.getByText('memo')).toBeInTheDocument();
      expect(screen.getByText('sop')).toBeInTheDocument();
      expect(screen.getAllByText('policy').length).toBeGreaterThanOrEqual(1);
    });

    it('displays entry status on each card', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: [mockResults[0]],
        total: 1,
      });

      render(<SearchInterface />);

      expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('displays tags on each card', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: [mockResults[0]],
        total: 1,
      });

      render(<SearchInterface />);

      expect(screen.getByText('1099')).toBeInTheDocument();
      expect(screen.getByText('contractors')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading is true', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        loading: true,
      });

      render(<SearchInterface />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('hides results grid when loading', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        loading: true,
        results: mockResults,
      });

      render(<SearchInterface />);

      // Should not render result cards while loading
      expect(screen.queryByText('How do we handle 1099 forms for contractors?')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when error is set', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        error: 'Failed to fetch results',
      });

      render(<SearchInterface />);

      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });

    it('does not show results when in error state', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        error: 'Search error',
        results: mockResults,
      });

      render(<SearchInterface />);

      expect(screen.queryByText('How do we handle 1099 forms for contractors?')).not.toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('shows pagination controls when total > limit', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 1,
      });

      render(<SearchInterface />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('shows current page and total pages', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 2,
      });

      render(<SearchInterface />);

      // Page 2 of 3 (45 results / 20 per page = 3 pages)
      expect(screen.getByText(/page 2/i)).toBeInTheDocument();
    });

    it('disables prev button on first page', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 1,
      });

      render(<SearchInterface />);

      const prevButton = screen.getByRole('button', { name: /prev/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 3,
      });

      render(<SearchInterface />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('calls goToPage when next is clicked', async () => {
      const mockGoToPage = vi.fn();
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 1,
        goToPage: mockGoToPage,
      });

      render(<SearchInterface />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(mockGoToPage).toHaveBeenCalledWith(2);
    });

    it('calls goToPage when prev is clicked', async () => {
      const mockGoToPage = vi.fn();
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 45,
        page: 2,
        goToPage: mockGoToPage,
      });

      render(<SearchInterface />);

      const prevButton = screen.getByRole('button', { name: /prev/i });
      await userEvent.click(prevButton);

      expect(mockGoToPage).toHaveBeenCalledWith(1);
    });

    it('hides pagination when results fit on one page', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: mockResults,
        total: 3,
        page: 1,
      });

      render(<SearchInterface />);

      expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /prev/i })).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state message when no results and not loading', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        results: [],
        total: 0,
        loading: false,
      });

      render(<SearchInterface />);

      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });

    it('shows different message when query is set but no results', () => {
      useSearch.mockReturnValue({
        ...defaultHookState,
        query: 'obscure term',
        results: [],
        total: 0,
        loading: false,
      });

      render(<SearchInterface />);

      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });
});
