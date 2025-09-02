import { render, screen } from '@testing-library/react';
import { validDangerNotification } from '../__data__/notifications-data';
import { NotificationItem } from '../NotificationItem';

describe('NotificationItem', () => {
  it('renders notification with title', () => {
    render(<NotificationItem {...validDangerNotification} />);

    expect(screen.getByText(validDangerNotification.title)).toBeInTheDocument();
    expect(screen.getByText(validDangerNotification.summary)).toBeInTheDocument();
  });

  it('renders different notification types', () => {
    const { rerender } = render(<NotificationItem {...validDangerNotification} type="warning" />);
    expect(screen.getByText(validDangerNotification.summary)).toBeInTheDocument();
    let item = screen.getByTestId('notification-item');
    expect(item).toHaveClass('pf-m-warning');

    rerender(<NotificationItem {...validDangerNotification} type="danger" />);
    expect(screen.getByText(validDangerNotification.summary)).toBeInTheDocument();
    item = screen.getByTestId('notification-item');
    expect(item).toHaveClass('pf-m-danger');

    rerender(<NotificationItem {...validDangerNotification} type="info" />);
    expect(screen.getByText(validDangerNotification.title)).toBeInTheDocument();
    item = screen.getByTestId('notification-item');
    expect(item).toHaveClass('pf-m-info');
  });

  it('renders timestamp using Timestamp component', () => {
    render(<NotificationItem {...validDangerNotification} />);
    expect(screen.getByText('Aug 10, 2025, 11:08 AM')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    render(<NotificationItem {...validDangerNotification} />);

    expect(screen.getByTestId('notification-item')).toBeInTheDocument();
    expect(screen.getByTestId('notification-header')).toBeInTheDocument();
    expect(screen.getByTestId('notification-body')).toBeInTheDocument();
  });

  it('passes variant to header component', () => {
    render(<NotificationItem {...validDangerNotification} type="warning" />);
    const item = screen.getByTestId('notification-item');
    expect(item).toHaveClass('pf-m-warning');
  });
});
