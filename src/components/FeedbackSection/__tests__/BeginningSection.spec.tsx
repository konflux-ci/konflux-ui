import { fireEvent, render, screen } from '@testing-library/react';
import BeginningSection from '../components/BeginningSection';
import { FeedbackSections } from '../consts';

jest.mock('~/analytics/conditional-checks', () => ({
  useIsAnalyticsEnabled: jest.fn(),
}));

const { useIsAnalyticsEnabled }: { useIsAnalyticsEnabled: jest.Mock } = jest.requireMock(
  '~/analytics/conditional-checks',
);

const setCurrentSectionMock = jest.fn();
const onCancelMock = jest.fn();

describe('BeginningSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: true });
  });

  it('should initialize with BeginningSection', () => {
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    screen.getByText('Share feedback');
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });

  it('should hide Share feedback when analytics is disabled', () => {
    useIsAnalyticsEnabled.mockReturnValue({ isAnalyticsEnabled: false });
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    expect(screen.queryByText('Share feedback')).not.toBeInTheDocument();
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });

  it('should change to Feedback section on Click', () => {
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    const shareFeedback = screen.getByText('Share feedback');
    fireEvent.click(shareFeedback);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenCalledWith(FeedbackSections.FeedbackSection);
  });

  it('should change to Feature section on Click', () => {
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    const featureCard = screen.getByText('Request a new feature');
    fireEvent.click(featureCard);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenLastCalledWith(FeedbackSections.FeatureSection);
  });

  it('should change to Bug section on Click', () => {
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    const bugCard = screen.getByText('Report a bug');
    fireEvent.click(bugCard);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenLastCalledWith(FeedbackSections.BugSection);
  });

  it('should close Form when Cancel is clicked', () => {
    render(<BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalled();
  });
});
