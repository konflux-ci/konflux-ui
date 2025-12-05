import { UseQueryResult } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { useK8sWatchResource } from '~/k8s';
import { ReleasePlanAdmissionKind } from '~/types';
import { createJestMockFunction } from '~/unit-test-utils/common';
import { MultipleNamespaceAdmissionsWatcher } from '../MultipleNamespaceAdmissionsWatcher';

// We need to mock the useK8sWatchResource hook
jest.mock('~/k8s', () => {
  const actual = jest.requireActual('~/k8s');
  return {
    ...actual,
    useK8sWatchResource: jest.fn(),
  };
});

const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<
  typeof useK8sWatchResource
>;

describe('MultipleNamespaceAdmissionsWatcher', () => {
  const mockAdmissions1: ReleasePlanAdmissionKind[] = [
    {
      metadata: { name: 'admission-1', namespace: 'ns1' },
      spec: { application: 'app1' },
    } as ReleasePlanAdmissionKind,
  ];

  const mockAdmissions2: ReleasePlanAdmissionKind[] = [
    {
      metadata: { name: 'admission-2', namespace: 'ns2' },
      spec: { application: 'app2' },
    } as ReleasePlanAdmissionKind,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseK8sWatchResource.mockClear();
  });

  const setupMockResponses = (
    responses: Record<
      string,
      { data: ReleasePlanAdmissionKind[]; isLoading: boolean; error: unknown }
    >,
  ) => {
    mockUseK8sWatchResource.mockImplementation((resourceSpec: { namespace: string }) => {
      const namespace = resourceSpec.namespace;
      return (responses[namespace] || {
        data: [],
        isLoading: false,
        error: null,
      }) as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
    });
  };

  it('should combine data from multiple namespaces', async () => {
    setupMockResponses({
      ns1: { data: mockAdmissions1, isLoading: false, error: null },
      ns2: { data: mockAdmissions2, isLoading: false, error: null },
    });

    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    render(<MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([...mockAdmissions1, ...mockAdmissions2]),
        false,
        undefined,
      );
    });
  });

  it('should ignore permission errors (403)', async () => {
    setupMockResponses({
      ns1: { data: mockAdmissions1, isLoading: false, error: null },
      'forbidden-ns': {
        data: [],
        isLoading: false,
        error: { code: 403, message: 'Forbidden' },
      },
    });

    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    render(
      <MultipleNamespaceAdmissionsWatcher
        namespaces={['ns1', 'forbidden-ns']}
        onUpdate={onUpdate}
      />,
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockAdmissions1, false, undefined);
    });
  });

  it('should report other errors', async () => {
    const otherError = { code: 500, message: 'Internal Server Error' };

    setupMockResponses({
      ns1: { data: mockAdmissions1, isLoading: false, error: null },
      'error-ns': {
        data: [],
        isLoading: false,
        error: otherError,
      },
    });

    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    render(
      <MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'error-ns']} onUpdate={onUpdate} />,
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockAdmissions1, false, otherError);
    });
  });

  it('should handle empty namespaces list', async () => {
    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    render(<MultipleNamespaceAdmissionsWatcher namespaces={[]} onUpdate={onUpdate} />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith([], false, undefined);
    });
  });

  it('should report loading state when any namespace is loading', async () => {
    setupMockResponses({
      ns1: { data: [], isLoading: true, error: null },
      ns2: { data: mockAdmissions2, isLoading: false, error: null },
    });

    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    render(<MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith([], true, undefined);
    });
  });

  it('should handle dynamic namespace changes', async () => {
    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    // Start with mock that returns loading for ns1 initially
    mockUseK8sWatchResource.mockImplementation((resourceSpec: { namespace: string }) => {
      const namespace = resourceSpec.namespace;
      if (namespace === 'ns1') {
        return {
          data: mockAdmissions1,
          isLoading: false,
          error: null,
        } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
      }
      return {
        data: [],
        isLoading: true,
        error: null,
      } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
    });

    // Start with one namespace
    const { rerender } = render(
      <MultipleNamespaceAdmissionsWatcher namespaces={['ns1']} onUpdate={onUpdate} />,
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockAdmissions1, false, undefined);
    });

    // Clear mock calls
    onUpdate.mockClear();

    // Change mock to include ns2 data
    mockUseK8sWatchResource.mockImplementation((resourceSpec: { namespace: string }) => {
      const namespace = resourceSpec.namespace;
      if (namespace === 'ns1') {
        return {
          data: mockAdmissions1,
          isLoading: false,
          error: null,
        } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
      }
      if (namespace === 'ns2') {
        return {
          data: mockAdmissions2,
          isLoading: false,
          error: null,
        } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
    });

    // Rerender with new namespace
    rerender(
      <MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />,
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([...mockAdmissions1, ...mockAdmissions2]),
        false,
        undefined,
      );
    });
  });

  // Simplified version - testing that loading state is properly aggregated
  it('should aggregate loading states correctly', async () => {
    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    setupMockResponses({
      ns1: { data: [], isLoading: true, error: null },
      ns2: { data: [], isLoading: true, error: null },
    });

    render(<MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />);

    // Should report loading initially
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith([], true, undefined);
    });
  });

  // Test partial loading - one namespace loaded, one still loading
  it('should handle partial loading state', async () => {
    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    // Use a simpler approach: mock returns different values for different namespaces
    mockUseK8sWatchResource.mockImplementation((resourceSpec: { namespace: string }) => {
      const namespace = resourceSpec.namespace;
      if (namespace === 'ns1') {
        // ns1 is still loading
        return {
          data: [],
          isLoading: true,
          error: null,
        } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
      }
      if (namespace === 'ns2') {
        // ns2 has data
        return {
          data: mockAdmissions2,
          isLoading: false,
          error: null,
        } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
      }
      return {
        data: [],
        isLoading: false,
        error: null,
      } as unknown as UseQueryResult<ReleasePlanAdmissionKind[]>;
    });

    render(<MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />);

    // Should report loading because ns1 is still loading
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockAdmissions2, true, undefined);
    });
  });

  it('should handle error state transitions', async () => {
    const onUpdate =
      createJestMockFunction<
        (data: ReleasePlanAdmissionKind[], isLoading: boolean, error?: unknown) => void
      >();

    setupMockResponses({
      ns1: { data: [], isLoading: false, error: { code: 500, message: 'Error' } },
      ns2: { data: mockAdmissions2, isLoading: false, error: null },
    });

    render(<MultipleNamespaceAdmissionsWatcher namespaces={['ns1', 'ns2']} onUpdate={onUpdate} />);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockAdmissions2, false, {
        code: 500,
        message: 'Error',
      });
    });
  });
});
