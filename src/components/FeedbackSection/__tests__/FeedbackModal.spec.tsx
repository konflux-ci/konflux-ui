import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackEvents } from '~/analytics/gen/analytics-types';
import FeedbackModal from '../FeedbackModal';

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [{ visibility: 'private' }]),
}));

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

const useTrackAnalyticsEventMock = jest.requireMock('~/analytics/hooks')
  .useTrackAnalyticsEvent as jest.Mock;

describe('FeedbackModal', () => {
  let trackEventMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    trackEventMock = jest.fn();
    useTrackAnalyticsEventMock.mockReturnValue(trackEventMock);
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

  it('on feedback submit tracks analytics and closes with submitClicked', async () => {
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
      expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feedback_submitted_event, {
        email: 'user@example.com',
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
      expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.feedback_submitted_event, {
        email: undefined,
        rating: 3,
        feedback: '',
      });
    });
    expect(onClose).toHaveBeenCalledWith(null, { submitClicked: true });
  });
});
