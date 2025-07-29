import { render, screen, fireEvent } from '@testing-library/react';
import { SystemNotificationConfig } from '~/types/notification-type';
import { NotificationHeader } from '../NotificationHeader';

describe('NotificationHeader', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockNotification = (created: string): SystemNotificationConfig => ({
    component: 'test-component',
    title: 'Test Notification',
    type: 'info',
    summary: 'Test summary',
    created,
  });

  it('renders with empty notifications', () => {
    render(<NotificationHeader onClose={mockOnClose} notifications={[]} />);

    expect(screen.getByText('0 total, 0 new (past hour)')).toBeInTheDocument();
  });

  it('renders with notifications from past hour', () => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const notifications = [
      createMockNotification(thirtyMinutesAgo.toISOString()),
      createMockNotification(thirtyMinutesAgo.toISOString()),
    ];

    render(<NotificationHeader onClose={mockOnClose} notifications={notifications} />);

    expect(screen.getByText('2 total, 2 new (past hour)')).toBeInTheDocument();
  });

  it('renders with mixed old and new notifications', () => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const notifications = [
      createMockNotification(thirtyMinutesAgo.toISOString()),
      createMockNotification(twoHoursAgo.toISOString()),
      createMockNotification(thirtyMinutesAgo.toISOString()),
    ];

    render(<NotificationHeader onClose={mockOnClose} notifications={notifications} />);

    expect(screen.getByText('3 total, 2 new (past hour)')).toBeInTheDocument();
  });

  it('renders with only old notifications', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const notifications = [
      createMockNotification(twoHoursAgo.toISOString()),
      createMockNotification(twoHoursAgo.toISOString()),
    ];

    render(<NotificationHeader onClose={mockOnClose} notifications={notifications} />);

    expect(screen.getByText('2 total, 0 new (past hour)')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<NotificationHeader onClose={mockOnClose} notifications={[]} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
