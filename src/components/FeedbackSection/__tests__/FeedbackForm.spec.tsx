import { fireEvent, render, screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import FeedbackForm from '../components/FeedbackForm';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const onCloseMock = jest.fn();
const onBackMock = jest.fn();
const onSubmitMock = jest.fn();

describe('FeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show Feedback Form details', () => {
    const view = routerRenderer(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    view.getByText('Share feedback');
    view.getByText(/Please share your experience using Konflux directly to the product team/);
    view.getByText('How happy are you with recent experience using Konflux');
    view.getByText(
      /Please rate using the following scale, 5 - very satisfied to 1 - very dissatisfied./,
    );
  });

  it('should go to Beginning section when Back button is clicked', () => {
    const view = render(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    const backButton = view.getByText('Back');
    fireEvent.click(backButton);
    expect(onBackMock).toHaveBeenCalled();
  });

  it('should close Form when Cancel is clicked', () => {
    const view = render(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    const cancelButton = view.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('keeps submit disabled until a rating is selected', () => {
    render(<FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />);
    const submitBtn = screen.getByRole('button', { name: /Submit feedback/i });
    expect(submitBtn).toBeDisabled();
    fireEvent.click(screen.getByTestId('radio-rating-4'));
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with the selected rating when the form is submitted', () => {
    render(<FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />);
    fireEvent.click(screen.getByTestId('radio-rating-2'));
    fireEvent.click(screen.getByRole('button', { name: /Submit feedback/i }));
    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith({
      description: '',
      scale: 2,
      email: '',
    });
  });
});
