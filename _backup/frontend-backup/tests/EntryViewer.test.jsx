/**
 * Tests for EntryViewer component
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryViewer from '../src/components/EntryViewer.jsx';

// Mock useEntries hook
vi.mock('../src/hooks/useEntries.js', () => ({
  default: vi.fn(),
}));

import useEntries from '../src/hooks/useEntries.js';

const mockGetEntry = vi.fn();
const mockClearStatus = vi.fn();

const defaultHookState = {
  submitEntry: vi.fn(),
  getEntry: mockGetEntry,
  currentEntry: null,
  loading: false,
  error: null,
  successMessage: null,
  clearStatus: mockClearStatus,
};

const mockEntry = {
  id: 'entry-abc',
  title: 'How do we handle 1099 forms for contractors?',
  type: 'memo',
  status: 'approved',
  clientName: 'Acme Corp',
  question: 'Can we deduct home office expenses for sole proprietors working remotely?',
  memo: 'Yes, sole proprietors can deduct home office via Form 8829 if used exclusively for business purposes.',
  tags: ['home office', 'deductions', 'Form 8829'],
  author: 'cromine@rhwcpas.com',
  createdAt: '2026-01-15T10:00:00Z',
  approvalHistory: [
    {
      action: 'submitted',
      by: 'staff@rhwcpas.com',
      at: '2026-01-15T10:00:00Z',
      note: 'Initial submission',
    },
    {
      action: 'approved',
      by: 'cromine@rhwcpas.com',
      at: '2026-01-16T14:30:00Z',
      note: 'Looks good',
    },
  ],
};

const mockOnBack = vi.fn();

describe('EntryViewer component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntries.mockReturnValue({ ...defaultHookState });
  });

  describe('loading state', () => {
    it('calls getEntry with entryId on mount', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(mockGetEntry).toHaveBeenCalledWith('entry-abc');
    });

    it('shows loading indicator while fetching', () => {
      useEntries.mockReturnValue({ ...defaultHookState, loading: true });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      useEntries.mockReturnValue({ ...defaultHookState, error: 'Entry not found' });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/entry not found/i)).toBeInTheDocument();
    });

    it('shows a back button even in error state', () => {
      useEntries.mockReturnValue({ ...defaultHookState, error: 'Entry not found' });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
  });

  describe('entry display', () => {
    beforeEach(() => {
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
    });

    it('displays the entry title', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/1099 forms for contractors/i)).toBeInTheDocument();
    });

    it('displays the client name', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/Acme Corp/i)).toBeInTheDocument();
    });

    it('displays the entry type', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      // "memo" appears in both the TypeBadge and the "Memo / Answer" section label
      expect(screen.getAllByText(/memo/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays the entry status', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      // "approved" appears in both the StatusBadge and the approval history
      expect(screen.getAllByText(/approved/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays the question / topic', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/home office expenses/i)).toBeInTheDocument();
    });

    it('displays the memo content', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      // "Form 8829" appears in both memo text and the tags list
      expect(screen.getAllByText(/Form 8829/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays all tags', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText('home office')).toBeInTheDocument();
      expect(screen.getByText('deductions')).toBeInTheDocument();
      expect(screen.getByText('Form 8829')).toBeInTheDocument();
    });

    it('displays the author', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      // author appears in metaRow and approval history
      expect(screen.getAllByText(/cromine@rhwcpas.com/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('approval history', () => {
    beforeEach(() => {
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
    });

    it('displays approval history section', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/approval history/i)).toBeInTheDocument();
    });

    it('shows each action in the history', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/submitted/i)).toBeInTheDocument();
      // "approved" appears in both StatusBadge and history — check there is at least one
      expect(screen.getAllByText(/approved/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows who performed each action', () => {
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByText(/staff@rhwcpas.com/i)).toBeInTheDocument();
    });

    it('handles entry with empty approval history', () => {
      useEntries.mockReturnValue({
        ...defaultHookState,
        currentEntry: { ...mockEntry, approvalHistory: [] },
      });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      // Should not crash
      expect(screen.getByText(/1099 forms for contractors/i)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('renders a back button', () => {
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
      const user = userEvent.setup();
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} />);

      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('edit button', () => {
    it('shows edit button when entry is approved', () => {
      const mockOnEdit = vi.fn();
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} onEdit={mockOnEdit} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('shows edit button when entry is pending', () => {
      const mockOnEdit = vi.fn();
      useEntries.mockReturnValue({
        ...defaultHookState,
        currentEntry: { ...mockEntry, status: 'pending' },
      });
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} onEdit={mockOnEdit} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('calls onEdit callback when edit button is clicked', async () => {
      const mockOnEdit = vi.fn();
      useEntries.mockReturnValue({ ...defaultHookState, currentEntry: mockEntry });
      const user = userEvent.setup();
      render(<EntryViewer entryId="entry-abc" onBack={mockOnBack} onEdit={mockOnEdit} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));
      expect(mockOnEdit).toHaveBeenCalledWith(mockEntry);
    });
  });
});
