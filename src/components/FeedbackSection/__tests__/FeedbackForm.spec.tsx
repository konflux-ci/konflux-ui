import { fireEvent, render } from '@testing-library/react';
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
  it('should show Feedback Form details', () => {
    const screen = routerRenderer(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    screen.getByText('Share feedback');
    screen.getByText(/Please share your experience using Konflux directly to the product team/);
    screen.getByText('How happy are you with recent experience using Konflux');
    screen.getByText(
      /Please rate using the following scale, 5 - very satisfied to 1 - very dissatisfied./,
    );
  });

  it('should go to Beginning section when Back button is clicked', () => {
    const screen = render(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    expect(onBackMock).toHaveBeenCalled();
  });

  it('should close Form when Cancel is clicked', () => {
    const screen = render(
      <FeedbackForm onClose={onCloseMock} onBack={onBackMock} onSubmit={onSubmitMock} />,
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
