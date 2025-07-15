import { screen } from '@testing-library/react';
import { HttpError } from '~/k8s/error';
import NamespaceListRow from '.././NamespaceListRow';
import { useApplications } from '../../../hooks/useApplications';
import { NamespaceKind } from '../../../types';
import { routerRenderer } from '../../../utils/test-utils';

// Mock useApplications hook
jest.mock('../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

const mockNamespace: NamespaceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'test-namespace',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  spec: {},
  status: {},
};

describe('NamespaceListRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the namespace name as a clickable link', () => {
    (useApplications as jest.Mock).mockReturnValue([[], true]);

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    const namespaceName = screen.getByText('test-namespace');
    expect(namespaceName.closest('a')).toHaveAttribute('href', '/ns/test-namespace/applications');
    expect(namespaceName.closest('a')).toHaveAttribute('title', 'Go to this namespace');
  });

  it('should display the application count', () => {
    (useApplications as jest.Mock).mockReturnValue([[], true]);

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('0 Applications')).toBeInTheDocument();
  });

  it('should show a loading skeleton when applications are loading', () => {
    (useApplications as jest.Mock).mockReturnValue([[], false]);

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('Loading application count')).toBeInTheDocument();
  });

  it('should pluralize application count ', () => {
    (useApplications as jest.Mock).mockReturnValueOnce([[{}], true]);

    const { rerender } = routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('1 Application')).toBeInTheDocument();
    (useApplications as jest.Mock).mockReturnValueOnce([[{}, {}], true]);

    rerender(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('2 Applications')).toBeInTheDocument();
  });

  it('should render the error message if there is an error loading the applications', () => {
    (useApplications as jest.Mock).mockReturnValue([
      undefined,
      true,
      new HttpError(undefined, 403),
    ]);
    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);
    expect(screen.getByText('Failed to load applications')).toBeInTheDocument();
  });
});
