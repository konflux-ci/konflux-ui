import { render, screen } from '@testing-library/react';
import { SystemNotificationConfig } from '~/types/notification-type';
import NotificationCenter from '../NotificationList';

// Mock the child components
jest.mock('../NotificationHeader', () => ({
  NotificationHeader: ({
    onClose,
    notifications,
  }: {
    onClose: () => void;
    notifications: SystemNotificationConfig[];
  }) => (
    <div data-test="notification-header" onClick={onClose}>
      Header with {notifications.length} notifications
    </div>
  ),
}));

jest.mock('../NotificationItem', () => ({
  NotificationItem: ({ title, summary }: { title: string; summary: string }) => (
    <div data-test="notification-item">
      {title}: {summary}
    </div>
  ),
}));

describe('NotificationCenter', () => {
  const mockCloseDrawer = jest.fn();

  const defaultProps = {
    isDrawerExpanded: true,
    closeDrawer: mockCloseDrawer,
    notifications: [],
    isLoading: false,
    error: null,
  };

  const createMockNotification = (
    overrides: Partial<SystemNotificationConfig> = {},
  ): SystemNotificationConfig => ({
    component: 'test-component',
    title: 'Test Notification',
    type: 'info',
    summary: 'Test summary',
    created: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<NotificationCenter {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = { code: 500, message: 'Server error' };
    render(<NotificationCenter {...defaultProps} error={error} />);

    expect(screen.getByText('Unable to load system notifications')).toBeInTheDocument();
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('does not render when drawer is collapsed', () => {
    render(<NotificationCenter {...defaultProps} isDrawerExpanded={false} />);

    expect(screen.queryByTestId('notification-header')).not.toBeInTheDocument();
  });

  it('renders notification drawer when expanded with no notifications', () => {
    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText('Header with 0 notifications')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-item')).not.toBeInTheDocument();
  });

  it('renders notification drawer with notifications', () => {
    const notifications = [
      createMockNotification({ title: 'First Notification', summary: 'First summary' }),
      createMockNotification({ title: 'Second Notification', summary: 'Second summary' }),
    ];

    render(<NotificationCenter {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('Header with 2 notifications')).toBeInTheDocument();

    const notificationItems = screen.getAllByTestId('notification-item');
    expect(notificationItems).toHaveLength(2);
    expect(screen.getByText('First Notification: First summary')).toBeInTheDocument();
    expect(screen.getByText('Second Notification: Second summary')).toBeInTheDocument();
  });

  it('passes notifications to header component', () => {
    const notifications = [createMockNotification(), createMockNotification()];

    render(<NotificationCenter {...defaultProps} notifications={notifications} />);

    expect(screen.getByText('Header with 2 notifications')).toBeInTheDocument();
  });

  it('renders notifications with unique keys', () => {
    const now = new Date().toISOString();
    const notifications = [
      createMockNotification({ created: now, type: 'info' }),
      createMockNotification({ created: now, type: 'warning' }),
    ];

    render(<NotificationCenter {...defaultProps} notifications={notifications} />);

    const notificationItems = screen.getAllByTestId('notification-item');
    expect(notificationItems).toHaveLength(2);
  });
});
