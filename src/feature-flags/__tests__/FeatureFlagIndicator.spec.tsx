import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureFlagIndicator } from '../FeatureFlagIndicator';
import { FlagKey, FLAGS } from '../flags';
import { FeatureFlagsStore } from '../store';

describe('FeatureFlagIndicator', () => {
  const originalFlags = { ...FeatureFlagsStore.state };

  afterEach(() => {
    FeatureFlagsStore.resetAll();
  });

  afterAll(() => {
    Object.entries(originalFlags).forEach(([k, v]) =>
      FeatureFlagsStore.set(k as keyof typeof FLAGS, v),
    );
  });

  it('renders nothing when unknown flags are provided', () => {
    const { container } = render(
      <FeatureFlagIndicator flags={['__unknown__'] as unknown as FlagKey[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders icon-only trigger by default', () => {
    render(<FeatureFlagIndicator flags={['dark-theme']} data-test="ff-icon" />);
    expect(screen.getByTestId('ff-icon')).toBeInTheDocument();
  });

  it('renders full label when fullLabel is true', () => {
    render(<FeatureFlagIndicator flags={['dark-theme']} fullLabel data-test="ff-label" />);
    expect(screen.getByTestId('ff-label')).toBeInTheDocument();
  });

  it('shows popover with descriptions for all flags on click', async () => {
    FeatureFlagsStore.set('dark-theme', true);
    FeatureFlagsStore.set('release-monitor', true);

    render(<FeatureFlagIndicator flags={['dark-theme', 'release-monitor']} data-test="ff-pop" />);
    await userEvent.click(screen.getByTestId('ff-pop'));

    expect(screen.getByText(FLAGS['dark-theme'].description)).toBeInTheDocument();
    expect(screen.getByText(FLAGS['release-monitor'].description)).toBeInTheDocument();
  });
});
