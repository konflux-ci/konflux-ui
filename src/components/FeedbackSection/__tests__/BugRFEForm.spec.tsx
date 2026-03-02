import { fireEvent, render } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import BugRFEForm from '../components/BugRFEForm';
import { FeedbackSections } from '../consts';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => [{ visibility: 'private' }]),
}));

const onCloseMock = jest.fn();
const setCurrentSectionMock = jest.fn();

describe('BugRFEForm', () => {
  it('should show BugForm when current Section is BugSection', () => {
    const screen = routerRenderer(
      <BugRFEForm
        currentSection={FeedbackSections.BugSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    screen.getByText('Report a bug');
    screen.getByText(/Describe the bug you encountered/);
    screen.getByText('Title');
    screen.getByText('Please provide detailed description of the bug');
  });

  it('should show RFEForm when current Section is FeatureSection', () => {
    const screen = render(
      <BugRFEForm
        currentSection={FeedbackSections.FeatureSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    screen.getByText('Request a new feature');
    screen.getByText(/Please provide detailed description of the feature/);
    screen.getByText('Title');
    screen.getByText(/Please provide detailed description of the bug/);
  });

  it('should go to Beginning section when Back button is clicked', () => {
    const screen = render(
      <BugRFEForm
        currentSection={FeedbackSections.FeatureSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenCalledWith(FeedbackSections.BeginningSection);
  });

  it('should close Form when Cancel is clicked', () => {
    const screen = render(
      <BugRFEForm
        currentSection={FeedbackSections.FeatureSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCloseMock).toHaveBeenCalled();
  });
});

describe('BugForm input and validation', () => {
  it('should show correct input fields', () => {
    const screen = routerRenderer(
      <BugRFEForm
        currentSection={FeedbackSections.BugSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'get system info' })).toBeVisible();
  });

  it('should have disabled Submit button by default', () => {
    const screen = routerRenderer(
      <BugRFEForm
        currentSection={FeedbackSections.BugSection}
        onClose={onCloseMock}
        setCurrentSection={setCurrentSectionMock}
      />,
    );
    expect(screen.getByRole('button', { name: 'Preview on Github' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Preview on Github' })).toBeDisabled();
  });
});
