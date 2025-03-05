import { screen, fireEvent, waitFor } from '@testing-library/react';
import { NamespaceKind } from '~/types';
import NamespaceListRow, { NamespaceButton } from '.././NamespaceListRow';
import { useApplications } from '../../../hooks/useApplications';
import { createReactRouterMock, routerRenderer } from '../../../utils/test-utils';

// Mock useApplications hook
jest.mock('../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

describe('NamespaceListRow', () => {
  const mockNamespace: NamespaceKind = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: 'test-namespace' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render namespace name', () => {
    (useApplications as jest.Mock).mockReturnValue([[], true]);

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('test-namespace')).toBeInTheDocument();
  });

  it('should display the correct application count when loaded', () => {
    (useApplications as jest.Mock).mockReturnValue([[{}, {}, {}], true]); // 3 applications loaded

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('3 Applications')).toBeInTheDocument();
  });

  it('should show a loading skeleton while applications are loading', () => {
    (useApplications as jest.Mock).mockReturnValue([[], false]); // Data not yet loaded

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('Loading application count')).toBeInTheDocument();
  });

  it('should pluralize application count ', () => {
    (useApplications as jest.Mock).mockReturnValueOnce([[{}], true]); // Data not yet loaded

    const { rerender } = routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('1 Application')).toBeInTheDocument();
    (useApplications as jest.Mock).mockReturnValueOnce([[{}, {}], true]);

    rerender(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('2 Applications')).toBeInTheDocument();
  });

  it('should render NamespaceButton with the correct namespace', () => {
    (useApplications as jest.Mock).mockReturnValue([[], true]);

    routerRenderer(<NamespaceListRow columns={[]} obj={mockNamespace} />);

    expect(screen.getByText('Go to the namespace')).toBeInTheDocument();
  });
});

describe('NamespaceButton', () => {
  const useFetcherMock = createReactRouterMock('useFetcher');
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render button with correct link', () => {
    routerRenderer(<NamespaceButton namespace="test-namespace" />);

    const button = screen.getByText('Go to the namespace');
    expect(button.closest('a')).toHaveAttribute('href', '/workspaces/test-namespace/applications');
    expect(button.closest('a')).toHaveAttribute('title', 'Go to this namespace');
  });

  it('should preload application data on hover and cancel on leave', async () => {
    const fetcherMock = { load: jest.fn() };
    useFetcherMock.mockReturnValue(fetcherMock);

    routerRenderer(<NamespaceButton namespace="test-namespace" />);

    const button = screen.getByText('Go to the namespace');

    fireEvent.mouseEnter(button);
    expect(fetcherMock.load).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);

    // fireEvent.click(button);
    await waitFor(() => {
      expect(fetcherMock.load).toHaveBeenCalledTimes(1);
    });
  });

  it('should not call fetch if mouse leaves early', async () => {
    jest.useFakeTimers();
    const fetcherMock = { load: jest.fn() };
    useFetcherMock.mockReturnValue(fetcherMock);

    routerRenderer(<NamespaceButton namespace="test-namespace" />);

    const button = screen.getByText('Go to the namespace');

    fireEvent.mouseEnter(button);
    jest.advanceTimersByTime(100);
    fireEvent.mouseLeave(button);

    jest.advanceTimersByTime(100);
    await waitFor(() => {
      expect(fetcherMock.load).not.toHaveBeenCalled();
    });
  });
});
