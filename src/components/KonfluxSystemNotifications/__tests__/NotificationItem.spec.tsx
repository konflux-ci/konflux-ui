import { render, screen } from '@testing-library/react';
import { SystemNotificationConfig } from '~/types/notification-type';
import { NotificationItem, formatTimestamp } from '../NotificationItem';

// Mock dayjs to have predictable timestamps
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs = Object.assign(
    jest.fn((date?: string) => {
      const instance = originalDayjs(date);
      if (!date) {
        // Return a fixed "now" time for consistent testing
        return originalDayjs('2024-01-01T12:00:00Z');
      }
      return instance;
    }),
    {
      extend: originalDayjs.extend,
    },
  );

  return mockDayjs;
});

describe('NotificationItem', () => {
  const defaultNotification: SystemNotificationConfig = {
    component: 'test-component',
    title: 'Test Notification Title',
    type: 'info',
    summary: 'This is a test notification summary',
    created: '2024-01-01T11:30:00Z', // 30 minutes ago from mocked "now"
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
});

describe('formatTimestamp', () => {
  beforeAll(() => {
    // Mock the current time to be consistent
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('formats recent timestamps as relative time', () => {
    const thirtyMinutesAgo = '2024-01-01T11:30:00Z';
    const result = formatTimestamp(thirtyMinutesAgo);

    expect(result).toBe('30 minutes ago');
  });

  it('formats old timestamps as absolute time', () => {
    const twoHoursAgo = '2024-01-01T10:00:00Z';
    const result = formatTimestamp(twoHoursAgo);

    expect(result).toMatch(/Jan 1 2024/);
  });

  it('formats timestamps exactly at the one hour boundary', () => {
    const oneHourAgo = '2024-01-01T11:00:00Z';
    const result = formatTimestamp(oneHourAgo);

    // At exactly 60 minutes, should use absolute format
    expect(result).toMatch(/Jan 1 2024/);
  });

  it('formats timestamps just under one hour as relative', () => {
    const fiftyNineMinutesAgo = '2024-01-01T11:01:00Z';
    const result = formatTimestamp(fiftyNineMinutesAgo);

    expect(result).toContain('an hour ago');
  });
});
