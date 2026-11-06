import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSecret } from '~/components/Secrets/__data__/mock-secrets';
import { COMMON_SECRETS_LABEL } from '~/consts/pipeline';
import { unLinkSecretFromBuildServiceAccount } from '~/utils/service-account/service-account-utils';
import { UnlinkSecret } from '../UnlinkSecret';

jest.mock('react-router-dom', () => ({
  useParams: () => ({
    componentName: 'test-component',
  }),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));

jest.mock('~/utils/service-account/service-account-utils', () => ({
  unLinkSecretFromBuildServiceAccount: jest.fn(),
}));

describe('UnlinkSecret', () => {
  const mockCommonSecret = {
    ...mockSecret,
    metadata: {
      ...mockSecret.metadata,
      name: 'test-common-secret',
      labels: {
        [COMMON_SECRETS_LABEL]: 'true',
      },
    },
  };

  it('should render basic unlink message for regular secret', () => {
    render(<UnlinkSecret onClose={() => {}} secret={mockSecret} />);

    expect(screen.getByText('my-secret')).toBeInTheDocument();
    expect(screen.getByText('test-component')).toBeInTheDocument();
    expect(screen.getByText(/will be unlinked from/)).toBeInTheDocument();
    expect(screen.queryByText(/This is a common secret/)).not.toBeInTheDocument();
  });

  it('should render warning message for common secret', () => {
    render(<UnlinkSecret onClose={() => {}} secret={mockCommonSecret} />);

    expect(screen.getByText('test-common-secret')).toBeInTheDocument();
    expect(screen.getByText('test-component')).toBeInTheDocument();
    expect(screen.getByText(/will be unlinked from/)).toBeInTheDocument();
    expect(screen.getByText(/This is a common secret/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Unlinking will remove its common secret label and prevent automatic linking to new components/,
      ),
    ).toBeInTheDocument();
  });

  it('should render unlink and cancel buttons', () => {
    render(<UnlinkSecret onClose={() => {}} secret={mockSecret} />);

    expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<UnlinkSecret onClose={onClose} secret={mockSecret} />);

    screen.getByRole('button', { name: /cancel/i }).click();
    expect(onClose).toHaveBeenCalledWith(undefined, { submitClicked: false });
  });

  it('should call onClose when unlink succeeds', async () => {
    (unLinkSecretFromBuildServiceAccount as jest.Mock).mockResolvedValue(undefined);
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<UnlinkSecret onClose={onClose} secret={mockSecret} />);

    await user.click(screen.getByRole('button', { name: /^unlink$/i }));

    expect(onClose).toHaveBeenCalledWith(undefined, { submitClicked: false });
  });

  it('should show an error and keep the modal open when unlink fails', async () => {
    (unLinkSecretFromBuildServiceAccount as jest.Mock).mockRejectedValue(new Error('boom'));
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<UnlinkSecret onClose={onClose} secret={mockSecret} />);

    await user.click(screen.getByRole('button', { name: /^unlink$/i }));

    expect(screen.getByTestId('unlink-secret-error')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
