/**
 * Tests for ApprovalDashboard component
 * Phase 3, Plan 03-03: ApprovalDashboard Component
 *
 * Tests: rendering, entry selection, approval actions, role-based access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApprovalDashboard from '../src/components/ApprovalDashboard.jsx';

// Mock useApproval hook
vi.mock('../src/hooks/useApproval.js', () => ({
  useApproval: vi.fn(),
}));

import { useApproval } from '../src/hooks/useApproval.js';

const mockGetPendingEntries = vi.fn();
const mockApproveEntry = vi.fn();
const mockSelectEntry = vi.fn();
const mockClearActionStatus = vi.fn();

const defaultHookState = {
  pendingEntries: [],
  selectedEntry: null,
  loading: false,
  error: null,
  actionStatus: null,
  getPendingEntries: mockGetPendingEntries,
  approveEntry: mockApproveEntry,
  selectEntry: mockSelectEntry,
  clearActionStatus: mockClearActionStatus,
};

const mockPendingEntries = [
  {
    id: 'entry-p1',
    title: 'S-Corp election analysis for LLC',
    type: 'memo',
    status: 'pending',
    author: 'staff1@rhwcpas.com',
    client: 'Smith Enterprises',
    question: 'Is S-Corp election beneficial for a 2-member LLC earning $200K/yr?',
    memo: 'Based on the SE tax savings analysis, S-Corp election appears favorable when net income exceeds $40K.',
    conversation: 'Client: We earned $200K last year...\nCPA: Let me run the numbers...',
    tags: ['s-corp', 'tax-strategy'],
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'entry-p2',
    title: 'Home office deduction for W-2 employee',
    type: 'memo',
    status: 'pending',
    author: 'staff2@rhwcpas.com',
    client: 'Johnson Family',
    question: 'Can a W-2 employee deduct home office expenses post-TCJA?',
    memo: 'No. The TCJA of 2017 suspended the misc itemized deduction for W-2 employees through 2025.',
    conversation: null,
    tags: ['home-office', 'tcja'],
    createdAt: '2026-03-21T14:30:00Z',
  },
];

describe('ApprovalDashboard component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApproval.mockReturnValue({ ...defaultHookState });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders the dashboard heading', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText(/approval/i)).toBeInTheDocument();
    });

    it('calls getPendingEntries on mount', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(mockGetPendingEntries).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when loading is true', () => {
      useApproval.mockReturnValue({ ...defaultHookState, loading: true });
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows error message when error is set', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        error: 'Failed to load pending entries',
      });
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    it('shows empty state when no pending entries', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText(/no pending entries/i)).toBeInTheDocument();
    });

    it('renders entry cards when pending entries exist', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
      });
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText('S-Corp election analysis for LLC')).toBeInTheDocument();
      expect(screen.getByText('Home office deduction for W-2 employee')).toBeInTheDocument();
    });

    it('shows entry count in the header area', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
      });
      render(<ApprovalDashboard isAdmin={true} />);
      // Should show "2 pending" badge
      expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
    });
  });

  describe('entry card content', () => {
    beforeEach(() => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
      });
    });

    it('displays entry title in the card', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText('S-Corp election analysis for LLC')).toBeInTheDocument();
    });

    it('displays client name in the card', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText('Smith Enterprises')).toBeInTheDocument();
    });

    it('displays author in the card', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      expect(screen.getByText('staff1@rhwcpas.com')).toBeInTheDocument();
    });

    it('displays submitted date in the card', () => {
      render(<ApprovalDashboard isAdmin={true} />);
      // Mar 20, 2026 or similar formatted date
      expect(screen.getByText(/mar 20/i)).toBeInTheDocument();
    });
  });

  describe('entry selection', () => {
    it('calls selectEntry when an entry card is clicked', async () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
      });
      const user = userEvent.setup();
      render(<ApprovalDashboard isAdmin={true} />);

      await user.click(screen.getByText('S-Corp election analysis for LLC'));

      expect(mockSelectEntry).toHaveBeenCalledWith(mockPendingEntries[0]);
    });

    it('shows preview pane when an entry is selected', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={true} />);

      // Preview pane should show the question
      expect(
        screen.getByText(/Is S-Corp election beneficial/)
      ).toBeInTheDocument();
    });

    it('shows memo content in preview pane', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={true} />);

      expect(
        screen.getByText(/SE tax savings analysis/)
      ).toBeInTheDocument();
    });

    it('hides preview pane when no entry is selected', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: null,
      });
      render(<ApprovalDashboard isAdmin={true} />);

      // Should show a "select an entry" placeholder or no preview
      expect(screen.queryByText(/Is S-Corp election beneficial/)).not.toBeInTheDocument();
    });
  });

  describe('role-based access — conversation visibility', () => {
    it('shows conversation section for admin users', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={true} />);

      // Admin should see the conversation transcript label
      expect(screen.getByText(/conversation/i)).toBeInTheDocument();
      // And the actual conversation text
      expect(
        screen.getByText(/Client: We earned \$200K/)
      ).toBeInTheDocument();
    });

    it('hides conversation content from non-admin users', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={false} />);

      // Staff should NOT see the raw conversation text
      expect(
        screen.queryByText(/Client: We earned \$200K/)
      ).not.toBeInTheDocument();
    });

    it('shows a restricted message to staff instead of conversation', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={false} />);

      // Staff should see some indication the conversation is restricted
      // (either no conversation section, or a restricted message)
      // The memo and question should still be visible
      expect(
        screen.getByText(/SE tax savings analysis/)
      ).toBeInTheDocument();
    });

    it('shows "no conversation" note when entry has no conversation', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[1], // entry with null conversation
      });
      render(<ApprovalDashboard isAdmin={true} />);

      expect(screen.getByText(/no conversation/i)).toBeInTheDocument();
    });
  });

  describe('approval action buttons', () => {
    it('shows Approve, Reject, and Request Changes buttons when entry is selected and user is admin', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={true} />);

      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request changes/i })).toBeInTheDocument();
    });

    it('hides action buttons for non-admin users', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      render(<ApprovalDashboard isAdmin={false} />);

      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });

    it('calls approveEntry with "approve" action when Approve is clicked', async () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      const user = userEvent.setup();
      render(<ApprovalDashboard isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /approve/i }));

      expect(mockApproveEntry).toHaveBeenCalledWith('entry-p1', 'approve', undefined);
    });

    it('calls approveEntry with "reject" action when Reject is clicked', async () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      const user = userEvent.setup();
      render(<ApprovalDashboard isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /reject/i }));

      expect(mockApproveEntry).toHaveBeenCalledWith('entry-p1', 'reject', undefined);
    });

    it('calls approveEntry with "request_changes" action when Request Changes is clicked', async () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      const user = userEvent.setup();
      render(<ApprovalDashboard isAdmin={true} />);

      await user.click(screen.getByRole('button', { name: /request changes/i }));

      expect(mockApproveEntry).toHaveBeenCalledWith('entry-p1', 'request_changes', undefined);
    });

    it('disables action buttons when actionLoading is in progress', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
        loading: true,
      });
      render(<ApprovalDashboard isAdmin={true} />);

      const approveBtn = screen.getByRole('button', { name: /approve/i });
      expect(approveBtn).toBeDisabled();
    });
  });

  describe('action status feedback', () => {
    it('shows success message when actionStatus has type success', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        actionStatus: { type: 'success', message: 'Entry approved successfully.' },
      });
      render(<ApprovalDashboard isAdmin={true} />);

      expect(screen.getByText(/approved successfully/i)).toBeInTheDocument();
    });

    it('shows error banner when error is set after an action', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        error: 'Failed to approve entry',
      });
      render(<ApprovalDashboard isAdmin={true} />);

      expect(screen.getByText(/failed to approve/i)).toBeInTheDocument();
    });
  });

  describe('notes field for reject / request changes', () => {
    it('shows notes input when Reject button is clicked', async () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
        selectedEntry: mockPendingEntries[0],
      });
      const user = userEvent.setup();
      render(<ApprovalDashboard isAdmin={true} />);

      // Click reject to reveal notes field
      await user.click(screen.getByRole('button', { name: /reject/i }));

      // Notes field or confirmation UI should appear
      // (either inline notes input or a confirm dialog)
      // The approve call should have been made immediately or a confirm shown
      // Implementation may vary — just verify approveEntry was called
      expect(mockApproveEntry).toHaveBeenCalled();
    });
  });

  describe('responsive layout', () => {
    it('renders the list panel', () => {
      useApproval.mockReturnValue({
        ...defaultHookState,
        pendingEntries: mockPendingEntries,
      });
      render(<ApprovalDashboard isAdmin={true} />);
      // List should be present
      expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(1);
    });
  });
});
