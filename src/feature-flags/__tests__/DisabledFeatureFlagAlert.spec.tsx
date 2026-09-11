import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisabledFeatureFlagAlert } from '../DisabledFeatureFlagAlert';
import { useFeatureFlags } from '../hooks';

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlags: jest.fn(),
}));

const useFeatureFlagsMock = useFeatureFlags as jest.Mock;
const setFlagMock = jest.fn();

describe('DisabledFeatureFlagAlert', () => {
  beforeEach(() => {
    useFeatureFlagsMock.mockReturnValue([{}, setFlagMock]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the alert content', () => {
    render(
      <DisabledFeatureFlagAlert
        flag="pipelineruns-kubearchive"
        title="Enable KubeArchive"
        actionLabel="Use KubeArchive"
        dataTest="feature-flag-alert"
      />,
    );

    expect(screen.getByTestId('feature-flag-alert')).toBeInTheDocument();
    expect(screen.getByText('Enable KubeArchive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use KubeArchive' })).toBeInTheDocument();
  });

  it('enables the configured flag when the action is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DisabledFeatureFlagAlert
        flag="pipelineruns-kubearchive"
        title="Enable KubeArchive"
        actionLabel="Use KubeArchive"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Use KubeArchive' }));

    expect(setFlagMock).toHaveBeenCalledWith('pipelineruns-kubearchive', true);
  });
});
