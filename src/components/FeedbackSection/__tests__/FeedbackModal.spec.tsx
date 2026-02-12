import { render } from '@testing-library/react';
import FeedbackModal from '../FeedbackModal';

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [{ visibility: 'private' }]),
}));

describe('FeedbackModal', () => {
  it('should initialize with BeginingSection Cards', () => {
    const screen = render(<FeedbackModal />);
    screen.getByText('Share feedback');
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });
  it('should have a Cancel button', () => {
    const screen = render(<FeedbackModal />);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });
});
