import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { analyticsService } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics/gen/analytics-types';
import { obfuscate } from '~/analytics/obfuscate';
import FeedbackModal from '../FeedbackModal';

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [{ visibility: 'private' }]),
}));

jest.mock('~/analytics/AnalyticsService', () => ({
  analyticsService: {
    track: jest.fn(),
  },
}));

jest.mock('~/analytics/obfuscate', () => ({
  obfuscate: jest.fn((value: string) => Promise.resolve(`obfuscated:${value}`)),
}));

function getTrackMock(): jest.Mock {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- replaced with jest.fn() via jest.mock
  return analyticsService.track as jest.Mock;
}

function getObfuscateMock(): jest.Mock {
  return obfuscate as unknown as jest.Mock;
}

describe('FeedbackModal', () => {
  beforeEach(() => {
    getTrackMock().mockClear();
    getObfuscateMock().mockClear();
  });

  it('should initialize with BeginingSection Cards', () => {
    const view = render(<FeedbackModal />);
    view.getByText('Share feedback');
    view.getByText('Report a bug');
    view.getByText('Request a new feature');
  });
  it('should have a Cancel button', () => {
    render(<FeedbackModal />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('on feedback submit obfuscates email, tracks analytics, and closes with submitClicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<FeedbackModal onClose={onClose} />);

    await user.click(screen.getByText('Share feedback'));

    const descriptionInput = await screen.findByTestId('feedback-description');
    await user.type(descriptionInput, 'Great product');
    await user.click(screen.getByTestId('radio-rating-5'));
    const emailInput = screen.getByTestId('feedback-email');
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: /Submit feedback/i }));

    await waitFor(() => {
      expect(getObfuscateMock()).toHaveBeenCalledWith('user@example.com');
    });
    await waitFor(() => {
      expect(getTrackMock()).toHaveBeenCalledWith(TrackEvents.feedback_submitted_event, {
        userId: 'obfuscated:user@example.com',
        rating: 5,
        feedback: 'Great product',
      });
    });
    expect(onClose).toHaveBeenCalledWith(null, { submitClicked: true });
  });

  it('on feedback submit with only rating tracks analytics without email or description', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<FeedbackModal onClose={onClose} />);

    await user.click(screen.getByText('Share feedback'));
    await screen.findByTestId('feedback-description');
    await user.click(screen.getByTestId('radio-rating-3'));
    await user.click(screen.getByRole('button', { name: /Submit feedback/i }));

    await waitFor(() => {
      expect(getTrackMock()).toHaveBeenCalledWith(TrackEvents.feedback_submitted_event, {
        userId: undefined,
        rating: 3,
        feedback: '',
      });
    });
    expect(getObfuscateMock()).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(null, { submitClicked: true });
  });
});
