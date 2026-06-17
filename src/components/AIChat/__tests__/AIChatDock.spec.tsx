import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { AIChatDock } from '../AIChatDock';
import { AIChatProvider } from '../AIChatProvider';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../components/AIChatPanel', () => ({
  AIChatPanel: () => <div data-test="ai-chat-panel" />,
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

describe('AIChatDock', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseIsOnFeatureFlag.mockReset();
  });

  it('renders toggle when feature flag is enabled', () => {
    render(
      <MemoryRouter>
        <AIChatProvider>
          <AIChatDock />
        </AIChatProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('ai-chat-toggle')).toBeInTheDocument();
  });

  it('opens chat panel when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AIChatProvider>
          <AIChatDock />
        </AIChatProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('ai-chat-panel')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('ai-chat-toggle'));
    expect(screen.getByTestId('ai-chat-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('ai-chat-toggle')).not.toBeInTheDocument();
  });
});
