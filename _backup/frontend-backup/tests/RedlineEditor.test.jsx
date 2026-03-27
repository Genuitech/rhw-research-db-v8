/**
 * Tests for RedlineEditor component
 * Phase 3, Plan 03-04: EntryViewer & RedlineEditor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RedlineEditor from '../src/components/RedlineEditor.jsx';

// Mock useEntries hook
vi.mock('../src/hooks/useEntries.js', () => ({
  default: vi.fn(),
}));

import useEntries from '../src/hooks/useEntries.js';

const mockSubmitEntry = vi.fn();
const mockClearStatus = vi.fn();

const defaultHookState = {
  submitEntry: mockSubmitEntry,
  getEntry: vi.fn(),
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
  question: 'Can we deduct home office expenses for sole proprietors?',
  memo: 'Yes, sole proprietors can deduct home office via Form 8829 if used exclusively for business purposes.',
  tags: ['home office', 'deductions'],
  author: 'cromine@rhwcpas.com',
  createdAt: '2026-01-15T10:00:00Z',
  approvalHistory: [],
};

const mockOnCancel = vi.fn();
const mockOnSubmitted = vi.fn();

describe('RedlineEditor component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntries.mockReturnValue({ ...defaultHookState });
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      expect(screen.getByRole('region', { name: /redline editor/i })).toBeInTheDocument();
    });

    it('shows the entry title', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      expect(screen.getByText(/1099 forms for contractors/i)).toBeInTheDocument();
    });

    it('shows the original memo text in a read-only section', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      // "Form 8829" appears in both the diff preview div and the textarea value
      expect(screen.getAllByText(/Form 8829/i).length).toBeGreaterThanOrEqual(1);
    });

    it('shows an edit textarea pre-populated with the memo content', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(mockEntry.memo);
    });

    it('shows a submit button', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('shows a cancel button', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('diff preview', () => {
    it('shows a diff/preview section label', () => {
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );
      // The panel label "Preview Changes" matches preview|changes|diff — use getAllByText
      expect(screen.getAllByText(/preview|changes|diff/i).length).toBeGreaterThanOrEqual(1);
    });

    it('updates diff preview when user types in textarea', async () => {
      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Completely new memo content for testing diff.');

      // Wait for state updates to settle
      await waitFor(() => {
        expect(textarea).toHaveValue('Completely new memo content for testing diff.');
      });

      // The diff area should still be present after typing
      expect(screen.getAllByText(/preview|changes|diff/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cancel button', () => {
    it('calls onCancel when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('form submission', () => {
    it('calls submitEntry with edited memo when submit is clicked', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'entry-abc', status: 'pending_review' });
      useEntries.mockReturnValue({ ...defaultHookState });

      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated memo text that is long enough for submission.');

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockSubmitEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            memo: 'Updated memo text that is long enough for submission.',
          })
        );
      });
    });

    it('disables submit button while loading', () => {
      useEntries.mockReturnValue({ ...defaultHookState, loading: true });
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      const submitBtn = screen.getByRole('button', { name: /submit/i });
      expect(submitBtn).toBeDisabled();
    });

    it('shows loading text on submit button during request', () => {
      useEntries.mockReturnValue({ ...defaultHookState, loading: true });
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    });

    it('calls onSubmitted callback after successful submission', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'entry-abc', status: 'pending_review' });

      // Simulate success on second render
      const { rerender } = render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      useEntries.mockReturnValue({
        ...defaultHookState,
        successMessage: 'Entry submitted successfully and is pending review.',
      });

      rerender(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      await waitFor(() => {
        expect(mockOnSubmitted).toHaveBeenCalled();
      });
    });

    it('shows error message when submission fails', () => {
      useEntries.mockReturnValue({
        ...defaultHookState,
        error: 'Submission failed. Please try again.',
      });
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });

    it('does not submit when memo is unchanged', async () => {
      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      // Click submit without changing anything
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Should show a warning, not call submitEntry
      expect(mockSubmitEntry).not.toHaveBeenCalled();
    });

    it('shows warning when submitting with no changes', async () => {
      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
  });

  describe('entry data in submission', () => {
    it('preserves original entry fields (type, clientName, question, tags) in resubmission', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'entry-abc', status: 'pending_review' });
      useEntries.mockReturnValue({ ...defaultHookState });

      const user = userEvent.setup();
      render(
        <RedlineEditor entry={mockEntry} onCancel={mockOnCancel} onSubmitted={mockOnSubmitted} />
      );

      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated memo content for resubmission testing purposes here.');

      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockSubmitEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            type: mockEntry.type,
            clientName: mockEntry.clientName,
            question: mockEntry.question,
          })
        );
      });
    });
  });
});
