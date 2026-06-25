import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagIndicator } from '../FeatureFlagIndicator';
import { FlagKey, FLAGS, FLAGS_STATUS } from '../flags';
import { useFeatureFlags } from '../hooks';

const readyIconColor = 'var(--pf-v5-global--success-color--100)';
const warningIconColor = 'var(--pf-v5-global--warning-color--100)';

jest.mock('../flags', () => {
  {
    const original = jest.requireActual('../flags');
    return {
      ...original,
      FLAGS: {
        'dark-theme': {
          description:
            'Enable the theme switcher in the header to toggle between light and dark modes.',
        },
        'stable-feature': {
          key: 'stable-feature',
          description: 'A stable feature flag',
          defaultEnabled: true,
          status: 'ready',
        },
        'column-management': {
          key: 'column-management',
          description: 'Enable the column management',
          defaultEnabled: false,
          status: 'wip',
        },
      },
    };
  }
});

jest.mock('../hooks', () => ({
  useFeatureFlags: jest.fn(() => [
    {
      'dark-theme': true,
      'stable-feature': true,
      'column-management': true,
    },
  ]),
}));

const useFeatureFlagsMock = useFeatureFlags as jest.Mock;

const getTriggerButton = () => screen.getByRole('button', { name: 'Feature flag information' });

const getTriggerIcon = () => {
  const icon = getTriggerButton().querySelector('svg');
  if (!icon) {
    throw new Error('Expected icon inside feature flag trigger button');
  }
  return icon;
};

describe('FeatureFlagIndicator', () => {
  afterEach(() => {
    useFeatureFlagsMock.mockReturnValue([
      {
        'dark-theme': true,
        'stable-feature': true,
        'column-management': true,
      },
    ]);
  });

  it('renders nothing when unknown flags are provided', () => {
    const { container } = render(
      <FeatureFlagIndicator flags={['__unknown__'] as unknown as FlagKey[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders icon-only trigger by default', () => {
    render(<FeatureFlagIndicator flags={['dark-theme'] as unknown as FlagKey[]} />);

    expect(getTriggerButton()).toBeInTheDocument();
    expect(getTriggerIcon()).toBeInTheDocument();
  });

  it('renders full label when fullLabel is true', () => {
    render(<FeatureFlagIndicator flags={['dark-theme'] as unknown as FlagKey[]} fullLabel />);

    expect(getTriggerButton()).toBeInTheDocument();
    expect(screen.getByText(FLAGS_STATUS.ready)).toBeInTheDocument();
  });

  it('shows popover with descriptions for all flags on click', async () => {
    render(
      <FeatureFlagIndicator flags={['dark-theme', 'column-management'] as unknown as FlagKey[]} />,
    );
    await userEvent.click(getTriggerButton());

    expect(screen.getByText(FLAGS['dark-theme' as FlagKey].description)).toBeInTheDocument();
    expect(screen.getByText(FLAGS['column-management' as FlagKey].description)).toBeInTheDocument();
  });

  it('uses success icon color when all active flags are ready', () => {
    useFeatureFlagsMock.mockReturnValue([{ 'stable-feature': true }]);

    render(<FeatureFlagIndicator flags={['stable-feature'] as unknown as FlagKey[]} />);

    expect(getTriggerIcon()).toHaveStyle({ color: readyIconColor });
  });

  it('uses warning icon color when any active flag is wip', () => {
    useFeatureFlagsMock.mockReturnValue([{ 'column-management': true }]);

    render(<FeatureFlagIndicator flags={['column-management'] as unknown as FlagKey[]} />);

    expect(getTriggerIcon()).toHaveStyle({ color: warningIconColor });
  });

  it('uses warning icon color when mixing ready and wip flags', () => {
    useFeatureFlagsMock.mockReturnValue([{ 'stable-feature': true, 'column-management': true }]);

    render(
      <FeatureFlagIndicator
        flags={['stable-feature', 'column-management'] as unknown as FlagKey[]}
      />,
    );

    expect(getTriggerIcon()).toHaveStyle({ color: warningIconColor });
  });
});
