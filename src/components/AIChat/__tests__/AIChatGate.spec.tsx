import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AIChatGate } from '~/components/AIChat/AIChatGate';

const mockUseIsOnFeatureFlag = jest.fn();
const mockUseIsLightspeedAvailable = jest.fn();

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: (flag: string) => mockUseIsOnFeatureFlag(flag),
  IfFeature: ({ flag, children }: { flag: string; children: React.ReactNode }) => {
    const isEnabled = mockUseIsOnFeatureFlag(flag);
    return isEnabled ? children : null;
  },
}));

jest.mock('~/lightspeed/useIsLightspeedAvailable', () => ({
  useIsLightspeedAvailable: () => mockUseIsLightspeedAvailable(),
}));

jest.mock('~/components/AIChat/AIChatDock', () => ({
  __esModule: true,
  default: () => <div data-test="ai-chat-dock">AI Chat Dock</div>,
  AIChatDock: () => <div data-test="ai-chat-dock">AI Chat Dock</div>,
}));

jest.mock('~/shared/components/lazy-load/lazy', () => ({
  lazyLoad: () => {
    const Dock = jest.requireMock('~/components/AIChat/AIChatDock').default as React.FC;
    return function LazyGateComponent() {
      return <Dock />;
    };
  },
}));

describe('AIChatGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseIsLightspeedAvailable.mockReturnValue({ isLightspeedAvailable: false });
  });

  it('renders nothing when the ai-chat feature flag is off', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseIsLightspeedAvailable.mockReturnValue({ isLightspeedAvailable: true });

    const { container } = render(<AIChatGate />);

    expect(mockUseIsOnFeatureFlag).toHaveBeenCalledWith('ai-chat');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when Lightspeed is unavailable', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseIsLightspeedAvailable.mockReturnValue({ isLightspeedAvailable: false });

    const { container } = render(<AIChatGate />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lazy-loads the chat dock when the flag is on and Lightspeed is available', async () => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseIsLightspeedAvailable.mockReturnValue({ isLightspeedAvailable: true });

    render(<AIChatGate />);

    await waitFor(() => {
      expect(screen.getByTestId('ai-chat-dock')).toBeInTheDocument();
    });
  });
});
