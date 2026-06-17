import { render, screen } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { ChatContextTarget } from '../context/ChatContextTarget';
import { CONTEXT_ID_ATTR, CONTEXT_LABEL_ATTR, CONTEXT_TARGET_ATTR } from '../context/types';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

describe('ChatContextTarget', () => {
  afterEach(() => {
    mockUseIsOnFeatureFlag.mockReset();
  });

  it('renders children without context wrapper when flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    render(
      <ChatContextTarget id="test-id" label="Test label">
        <div data-test="child">Child content</div>
      </ChatContextTarget>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-chat-context-target-test-id')).not.toBeInTheDocument();
  });

  it('renders data attributes on wrapper when flag is on', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    render(
      <ChatContextTarget id="test-id" label="Test label" description="Test description">
        <div data-test="child">Child content</div>
      </ChatContextTarget>,
    );

    const wrapper = screen.getByTestId('ai-chat-context-target-test-id');
    expect(wrapper).toHaveAttribute(CONTEXT_TARGET_ATTR, 'true');
    expect(wrapper).toHaveAttribute(CONTEXT_ID_ATTR, 'test-id');
    expect(wrapper).toHaveAttribute(CONTEXT_LABEL_ATTR, 'Test label');
    expect(wrapper).toHaveAttribute('data-ai-chat-context-description', 'Test description');
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
