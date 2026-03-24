import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmissionForm from '../src/components/SubmissionForm.jsx';

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

describe('SubmissionForm component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntries.mockReturnValue({ ...defaultHookState });
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<SubmissionForm />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<SubmissionForm />);
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/memo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conversation/i)).toBeInTheDocument();
    });

    it('renders type select with correct options', () => {
      render(<SubmissionForm />);
      const typeSelect = screen.getByLabelText(/type/i);
      expect(typeSelect.tagName).toBe('SELECT');
      expect(screen.getByRole('option', { name: /memo/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /sop/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /policy/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<SubmissionForm />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('conversation field is optional (no required indicator)', () => {
      render(<SubmissionForm />);
      const conversationField = screen.getByLabelText(/conversation/i);
      expect(conversationField).not.toHaveAttribute('required');
    });
  });

  describe('form validation', () => {
    it('shows error when submitting empty required fields', async () => {
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Client name required
      expect(screen.getByText(/client.*required/i)).toBeInTheDocument();
    });

    it('shows error when question is too short (under 20 chars)', async () => {
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await user.type(screen.getByLabelText(/client/i), 'Test Client');
      await user.type(screen.getByLabelText(/question/i), 'Too short');
      await user.type(screen.getByLabelText(/memo/i), 'This memo is long enough to pass the minimum character requirement.');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/question.*20 char/i)).toBeInTheDocument();
    });

    it('shows error when memo is too short (under 20 chars)', async () => {
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await user.type(screen.getByLabelText(/client/i), 'Test Client');
      await user.type(screen.getByLabelText(/question/i), 'This question is long enough to meet the requirement.');
      await user.type(screen.getByLabelText(/memo/i), 'Too short');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/memo.*20 char/i)).toBeInTheDocument();
    });

    it('does not call submitEntry when validation fails', async () => {
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await user.click(screen.getByRole('button', { name: /submit/i }));

      expect(mockSubmitEntry).not.toHaveBeenCalled();
    });

    it('clears field error when user starts typing', async () => {
      const user = userEvent.setup();
      render(<SubmissionForm />);

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /submit/i }));
      expect(screen.getByText(/client.*required/i)).toBeInTheDocument();

      // Start typing in client field
      await user.type(screen.getByLabelText(/client/i), 'A');

      expect(screen.queryByText(/client.*required/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    const fillValidForm = async (user) => {
      await user.selectOptions(screen.getByLabelText(/type/i), 'memo');
      await user.type(screen.getByLabelText(/client/i), 'Test Client LLC');
      await user.type(
        screen.getByLabelText(/question/i),
        'Can we deduct home office expenses for sole proprietors?'
      );
      await user.type(
        screen.getByLabelText(/memo/i),
        'Yes, sole proprietors can deduct home office via Form 8829 if used exclusively for business.'
      );
      await user.type(screen.getByLabelText(/tags/i), 'home office, deductions');
    };

    it('calls submitEntry with correct data on valid submission', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'abc123', status: 'pending_review' });
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockSubmitEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'memo',
            clientName: 'Test Client LLC',
            question: expect.stringContaining('home office expenses'),
            memo: expect.stringContaining('Form 8829'),
          })
        );
      });
    });

    it('parses tags from comma-separated string', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'abc123', status: 'pending_review' });
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        const callArg = mockSubmitEntry.mock.calls[0][0];
        expect(Array.isArray(callArg.tags)).toBe(true);
        expect(callArg.tags).toContain('home office');
        expect(callArg.tags).toContain('deductions');
      });
    });

    it('includes empty conversation when not filled', async () => {
      mockSubmitEntry.mockResolvedValueOnce({ id: 'abc123', status: 'pending_review' });
      const user = userEvent.setup();
      render(<SubmissionForm />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        const callArg = mockSubmitEntry.mock.calls[0][0];
        expect(callArg.conversation).toBe('');
      });
    });
  });

  describe('loading state', () => {
    it('disables submit button during loading', () => {
      useEntries.mockReturnValue({ ...defaultHookState, loading: true });
      render(<SubmissionForm />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading text on submit button during request', () => {
      useEntries.mockReturnValue({ ...defaultHookState, loading: true });
      render(<SubmissionForm />);

      expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('displays success message after successful submission', () => {
      useEntries.mockReturnValue({
        ...defaultHookState,
        successMessage: 'Entry submitted successfully and is pending review.',
      });
      render(<SubmissionForm />);

      expect(screen.getByText(/submitted successfully/i)).toBeInTheDocument();
    });

    it('clears form after successful submission', async () => {
      // Start in idle state, then transition to success
      const { rerender } = render(<SubmissionForm />);
      const user = userEvent.setup();

      // Fill in the form
      await user.type(screen.getByLabelText(/client/i), 'Test Client LLC');

      // Simulate success state
      useEntries.mockReturnValue({
        ...defaultHookState,
        successMessage: 'Entry submitted successfully and is pending review.',
      });

      rerender(<SubmissionForm />);

      // The client name field should be empty after success
      expect(screen.getByLabelText(/client/i)).toHaveValue('');
    });
  });

  describe('error state', () => {
    it('displays error message when submission fails', () => {
      useEntries.mockReturnValue({
        ...defaultHookState,
        error: 'Submission failed. Please try again.',
      });
      render(<SubmissionForm />);

      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });

    it('shows retry guidance on error', () => {
      useEntries.mockReturnValue({
        ...defaultHookState,
        error: 'Submission failed. Please try again.',
      });
      render(<SubmissionForm />);

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  describe('responsiveness', () => {
    it('renders correctly at mobile viewport', () => {
      // Just verify it renders without errors — visual responsive check is manual
      render(<SubmissionForm />);
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });
});
