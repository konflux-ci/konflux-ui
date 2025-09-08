import { render, screen } from '@testing-library/react';
import { mockSecret } from '~/components/Secrets/__data__/mock-secrets';
import { COMMON_SECRETS_LABEL } from '~/consts/pipeline';
import { useComponent } from '~/hooks/useComponents';
import { UnlinkSecret } from '../UnlinkSecret';

// Mock the hooks
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    componentName: 'test-component',
  }),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));

const useComponentMock = useComponent as jest.Mock;

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

  beforeEach(() => {
    useComponentMock.mockReturnValue([
      {
        metadata: {
          name: 'test-component',
          namespace: 'test-namespace',
        },
      },
      true, // loaded
      null, // error
    ]);
  });

  it('should render basic unlink message for regular secret', () => {
    render(<UnlinkSecret onClose={() => {}} secret={mockSecret} />);

    expect(screen.getByText('my-secret')).toBeInTheDocument();
    expect(screen.getByText('test-component')).toBeInTheDocument();
    expect(screen.getByText(/will be unlinked from/)).toBeInTheDocument();
    expect(screen.queryByText(/This is a common secret/)).not.toBeInTheDocument();
  });

  it('should render error message for component not found', () => {
    useComponentMock.mockReturnValue([undefined, false, { code: 404 }]);
    render(<UnlinkSecret onClose={() => {}} secret={mockSecret} />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
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
    expect(onClose).toHaveBeenCalledWith(null, { submitClicked: false });
  });
});
