import { render, screen } from '@testing-library/react';
import { SystemNotificationConfig } from '~/types/notification-type';
import { NotificationItem } from '../NotificationItem';

// Mock PatternFly components to avoid import issues
jest.mock('@patternfly/react-core/dist/esm/components', () => ({
  NotificationDrawerListItem: ({ children }: { children: React.ReactNode }) => (
    <div data-test="notification-drawer-list-item">{children}</div>
  ),
  NotificationDrawerListItemHeader: ({ title, variant }: { title: string; variant: string }) => (
    <div data-test="notification-header" data-variant={variant}>
      {title}
    </div>
  ),
  NotificationDrawerListItemBody: ({
    children,
    timestamp,
  }: {
    children: React.ReactNode;
    timestamp?: React.ReactNode;
  }) => (
    <div data-test="notification-body">
      {timestamp && <div data-test="notification-timestamp">{timestamp}</div>}
      {children}
    </div>
  ),
}));

// Mock the Timestamp component to avoid PatternFly import issues
jest.mock('~/shared/components/timestamp', () => ({
  Timestamp: ({ timestamp, simple }: { timestamp: string; simple?: boolean }) => (
    <span data-test="timestamp">{simple ? timestamp : `Timestamp: ${timestamp}`}</span>
  ),
}));

describe('NotificationItem', () => {
  const defaultNotification: SystemNotificationConfig = {
    component: 'test-component',
    title: 'Test Notification Title',
    type: 'info',
    summary: 'This is a test notification summary',
    created: '2024-01-01T11:30:00Z',
  };

  it('renders notification with title', () => {
    render(<NotificationItem {...defaultNotification} />);

    expect(screen.getByText('Test Notification Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification summary')).toBeInTheDocument();
  });

  it('renders notification with component name when title is empty', () => {
    render(<NotificationItem {...defaultNotification} title="" />);

    expect(screen.getByText('test-component')).toBeInTheDocument();
  });

  it('renders notification with component name when title is whitespace', () => {
    render(<NotificationItem {...defaultNotification} title="   " />);

    expect(screen.getByText('test-component')).toBeInTheDocument();
  });

  it('renders notification with trimmed title', () => {
    render(<NotificationItem {...defaultNotification} title="  Trimmed Title  " />);

    expect(screen.getByText('Trimmed Title')).toBeInTheDocument();
  });

  it('renders different notification types', () => {
    const { rerender } = render(<NotificationItem {...defaultNotification} type="warning" />);
    expect(screen.getByText('Test Notification Title')).toBeInTheDocument();

    rerender(<NotificationItem {...defaultNotification} type="danger" />);
    expect(screen.getByText('Test Notification Title')).toBeInTheDocument();

    rerender(<NotificationItem {...defaultNotification} type="info" />);
    expect(screen.getByText('Test Notification Title')).toBeInTheDocument();
  });

  it('renders summary content', () => {
    render(<NotificationItem {...defaultNotification} summary="Custom summary content" />);

    expect(screen.getByText('Custom summary content')).toBeInTheDocument();
  });

  it('renders timestamp using Timestamp component', () => {
    render(<NotificationItem {...defaultNotification} />);

    expect(screen.getByTestId('notification-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('timestamp')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01T11:30:00Z')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    render(<NotificationItem {...defaultNotification} />);

    expect(screen.getByTestId('notification-drawer-list-item')).toBeInTheDocument();
    expect(screen.getByTestId('notification-header')).toBeInTheDocument();
    expect(screen.getByTestId('notification-body')).toBeInTheDocument();
  });

  it('passes variant to header component', () => {
    render(<NotificationItem {...defaultNotification} type="warning" />);

    const header = screen.getByTestId('notification-header');
    expect(header).toHaveAttribute('data-variant', 'warning');
  });
});
