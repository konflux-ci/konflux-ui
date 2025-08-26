import { render, screen, fireEvent } from '@testing-library/react';
import {
  firstValidInfoNotification,
  secondValidInfoNotification,
  thirdValidDangerNotification,
} from '../__data__/notifications-data';
import { NotificationHeader } from '../NotificationHeader';

describe('NotificationHeader', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with empty notifications', () => {
    render(<NotificationHeader onClose={mockOnClose} notifications={[]} />);

    expect(screen.getByText('0 total, 0 new (past hour)')).toBeInTheDocument();
  });

  it('renders with notifications from past hour', () => {
    const notifications = [thirdValidDangerNotification, secondValidInfoNotification];

    render(<NotificationHeader onClose={mockOnClose} notifications={notifications} />);

    expect(screen.getByText('2 total, 2 new (past hour)')).toBeInTheDocument();
  });

  it('renders with mixed old and new notifications', () => {
    const notifications = [
      firstValidInfoNotification,
      secondValidInfoNotification,
      thirdValidDangerNotification,
    ];

    render(<NotificationHeader onClose={mockOnClose} notifications={notifications} />);

    expect(screen.getByText('3 total, 2 new (past hour)')).toBeInTheDocument();
  });

  it('renders with only old notifications', () => {
    const notifications = [firstValidInfoNotification, firstValidInfoNotification];

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
