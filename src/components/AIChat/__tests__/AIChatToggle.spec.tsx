import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { AIChatProvider } from '../AIChatProvider';
import { AIChatToggle } from '../AIChatToggle';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

describe('AIChatToggle', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseIsOnFeatureFlag.mockReset();
  });

  it('renders header toggle when feature flag is enabled', () => {
    render(
      <MemoryRouter>
        <AIChatProvider>
          <AIChatToggle />
        </AIChatProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('ai-chat-header-toggle')).toBeInTheDocument();
  });

  it('toggles aria-expanded when clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AIChatProvider>
          <AIChatToggle />
        </AIChatProvider>
      </MemoryRouter>,
    );

    const toggle = screen.getByTestId('ai-chat-header-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
