import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import BeginningSection from '../components/BeginningSection';
import { FeedbackSections } from '../consts';

jest.mock('~/feature-flags/hooks', () => ({
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const setCurrentSectionMock = jest.fn();
const onCancelMock = jest.fn();

describe('BeginningSection', () => {
  it('should initialize with BeginingSection', () => {
    const screen = render(
      <BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />,
    );
    screen.getByText('Share feedback');
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });

  it('should change to Feedback section on Click', () => {
    const screen = render(
      <BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />,
    );
    const shareFeedback = screen.getByText('Share feedback');
    fireEvent.click(shareFeedback);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenCalledWith(FeedbackSections.FeedbackSection);
  });

  it('should change to Feature section on Click', () => {
    const screen = render(
      <BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />,
    );
    const featureCard = screen.getByText('Request a new feature');
    fireEvent.click(featureCard);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenLastCalledWith(FeedbackSections.FeatureSection);
  });

  it('should change to Bug section on Click', () => {
    const screen = render(
      <BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />,
    );
    const bugCard = screen.getByText('Report a bug');
    fireEvent.click(bugCard);
    expect(setCurrentSectionMock).toHaveBeenCalled();
    expect(setCurrentSectionMock).toHaveBeenLastCalledWith(FeedbackSections.BugSection);
  });

  it('should close Form when Cancel is clicked', () => {
    const screen = render(
      <BeginningSection onSectionChange={setCurrentSectionMock} onClose={onCancelMock} />,
    );
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalled();
  });
});
