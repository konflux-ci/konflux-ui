import { render, screen } from '@testing-library/react';
import { SystemNotificationConfig } from '~/types/notification-type';
import NotificationCenter from '../NotificationList';
import { useSystemNotifications } from '../useSystemNotifications';

jest.mock('../useSystemNotifications', () => ({
  useSystemNotifications: jest.fn(),
}));
const mockUseSystemNotifications = useSystemNotifications as jest.Mock;
describe('NotificationCenter', () => {
  const mockCloseDrawer = jest.fn();

  const defaultProps = {
    isDrawerExpanded: true,
    closeDrawer: mockCloseDrawer,
  };

  const createMockNotification = (
    overrides: Partial<SystemNotificationConfig> = {},
  ): SystemNotificationConfig => ({
    title: 'Test Notification',
    type: 'info',
    summary: 'Test summary',
    created: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock return value
    mockUseSystemNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders loading state', () => {
    mockUseSystemNotifications.mockReturnValue({
      notifications: [],
      isLoading: true,
      error: null,
    });

    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = { code: 500, message: 'Server error' };
    mockUseSystemNotifications.mockReturnValue({
      notifications: [],
      isLoading: false,
      error,
    });

    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText('Unable to load system notifications')).toBeInTheDocument();
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('does not render when drawer is collapsed', () => {
    render(<NotificationCenter {...defaultProps} isDrawerExpanded={false} />);

    expect(screen.queryByTestId('notification-header')).not.toBeInTheDocument();
  });

  it('renders notification drawer when expanded with no notifications', () => {
    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText('0 total, 0 new (past hour)')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-item')).not.toBeInTheDocument();
  });

  it('renders notification drawer with notifications', () => {
    const notifications = [
      createMockNotification({ title: 'First Notification', summary: 'First summary' }),
      createMockNotification({ title: 'Second Notification', summary: 'Second summary' }),
    ];

    mockUseSystemNotifications.mockReturnValue({
      notifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText('2 total, 2 new (past hour)')).toBeInTheDocument();

    const notificationItems = screen.getAllByTestId('notification-item');
    expect(notificationItems).toHaveLength(2);
    expect(screen.getByText('First summary')).toBeInTheDocument();
    expect(screen.getByText('Second summary')).toBeInTheDocument();
  });

  it('passes notifications to header component', () => {
    const notifications = [createMockNotification(), createMockNotification()];

    mockUseSystemNotifications.mockReturnValue({
      notifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationCenter {...defaultProps} />);

    expect(screen.getByText('2 total, 2 new (past hour)')).toBeInTheDocument();
  });

  it('renders notifications with unique keys', () => {
    const now = new Date().toISOString();
    const notifications = [
      createMockNotification({ created: now, type: 'info' }),
      createMockNotification({ created: now, type: 'warning' }),
    ];

    mockUseSystemNotifications.mockReturnValue({
      notifications,
      isLoading: false,
      error: null,
    });

    render(<NotificationCenter {...defaultProps} />);

    const notificationItems = screen.getAllByTestId('notification-item');
    expect(notificationItems).toHaveLength(2);
  });
});
