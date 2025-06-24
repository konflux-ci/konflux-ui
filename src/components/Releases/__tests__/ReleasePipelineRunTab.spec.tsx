import { useParams } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import ReleasePipelineRunTab from '../ReleasePipelineRunTab';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(() => [new URLSearchParams(), jest.fn()]),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(),
}));

jest.mock('~/hooks/useReleasePlans', () => ({
  useReleasePlan: jest.fn(() => [null]),
}));

jest.mock('~/hooks/useReleases', () => ({
  useRelease: jest.fn(() => [null]),
}));

const useParamsMock = useParams as jest.Mock;
const usePipelineRunsMock = usePipelineRuns as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

const TestedComponent = () => <ReleasePipelineRunTab />;

describe('ReleasePipelineRunTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ applicationName: 'test-app', releaseName: 'test-release' });
    usePipelineRunsMock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should render loading state', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<TestedComponent />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      true,
      { code: 500 },
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<TestedComponent />);
    expect(screen.getByText('Unable to load pipeline runs')).toBeInTheDocument();
  });

  it('should render empty state when no pipeline runs are present', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<TestedComponent />);
    expect(screen.getByText(/Keep tabs on components and activity/)).toBeInTheDocument();
  });

  it('should render pipeline runs list when data is available', () => {
    usePipelineRunsMock.mockReturnValue([
      [
        {
          metadata: { name: 'test-pipeline-run', uid: '123' },
        },
      ],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<TestedComponent />);
    expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
  });

  it('should filter pipeline runs by name', async () => {
    usePipelineRunsMock.mockReturnValue([
      [
        { metadata: { name: 'test-pipeline-run-1', uid: '123' } },
        { metadata: { name: 'another-pipeline-run', uid: '456' } },
      ],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<TestedComponent />);
    const filterInput = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filterInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.queryByText('another-pipeline-run')).not.toBeInTheDocument();
    });
  });
});
