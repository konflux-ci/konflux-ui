import { render, waitFor } from '@testing-library/react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { useK8sWatchResource } from '~/k8s';
import { ReleasePlanAdmissionModel, ReleasePlanModel } from '~/models';
import ReleasesInNamespace from '../ReleasesInNamespace';

// Only mock the specific hooks you mentioned
jest.mock('~/hooks/useK8sAndKarchResources');
jest.mock('~/k8s', () => ({
  useK8sWatchResource: jest.fn(),
}));

// DO NOT mock MultipleNamespaceAdmissionsWatcher
// This allows the real component to run

const mockUseK8sAndKarchResources = useK8sAndKarchResources as jest.Mock;
const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;

describe('ReleasesInNamespace', () => {
  const mockReleases = [
    {
      metadata: { name: 'release-1', namespace: 'ns1' },
      spec: { releasePlan: 'plan-1' },
    },
  ];

  const mockReleasePlans = [
    {
      metadata: {
        name: 'plan-1',
        namespace: 'ns1',
        labels: {
          'release.appstudio.openshift.io/releasePlanAdmission': 'rpa-1',
        },
      },
      spec: { target: 'target-ns' },
    },
  ];

  const mockReleasePlanAdmissions = [
    {
      metadata: { name: 'rpa-1', namespace: 'target-ns' },
      spec: {
        data: {
          releaseNotes: {
            'product_name': 'Test Product',
            'product_version': '1.0',
          },
        },
      },
    },
  ];

  const onReleasesLoaded = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseK8sAndKarchResources.mockReturnValue({
      data: mockReleases,
      isLoading: false,
      clusterError: null,
      archiveError: null,
    });

    // Mock useK8sWatchResource to handle calls from both:
    // 1. ReleasesInNamespace (for ReleasePlanModel and ReleasePlanAdmissionModel in current namespace)
    // 2. MultipleNamespaceAdmissionsWatcher (for ReleasePlanAdmissionModel in target namespaces)
    mockUseK8sWatchResource.mockImplementation((resourceSpec, model) => {
      const { namespace } = resourceSpec || {};

      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans, isLoading: false, error: null };
      }

      if (model === ReleasePlanAdmissionModel) {
        // This handles both:
        // - Local namespace RPAs (called directly by ReleasesInNamespace)
        // - Target namespace RPAs (called by SingleNamespaceWatcher inside MultipleNamespaceAdmissionsWatcher)

        if (namespace === 'ns1') {
          // Local namespace RPAs - return empty for local namespace
          return { data: [], isLoading: false, error: null };
        }

        if (namespace === 'target-ns') {
          // Target namespace RPAs - return mock data
          return { data: mockReleasePlanAdmissions, isLoading: false, error: null };
        }

        if (namespace === 'another-ns') {
          // Another target namespace
          return { data: [], isLoading: false, error: null };
        }

        // Default for any other namespace
        return { data: [], isLoading: false, error: null };
      }

      return { data: [], isLoading: false, error: null };
    });
  });

  it('should load releases and enhance them with product info', async () => {
    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      expect(onReleasesLoaded).toHaveBeenCalledWith([
        expect.objectContaining({
          metadata: { name: 'release-1', namespace: 'ns1' },
          product: 'Test Product',
          productVersion: '1.0',
          rpa: 'rpa-1',
        }),
      ]);
    });
  });

  it('should handle loading state', () => {
    mockUseK8sAndKarchResources.mockReturnValue({
      data: [],
      isLoading: true,
      clusterError: null,
      archiveError: null,
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    expect(onReleasesLoaded).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle ReleasePlans error', async () => {
    const error = new Error('RP error');
    mockUseK8sWatchResource.mockImplementation((resourceSpec, model) => {
      const { namespace } = resourceSpec || {};

      if (model === ReleasePlanModel) {
        return { data: null, isLoading: false, error };
      }

      if (model === ReleasePlanAdmissionModel) {
        if (namespace === 'ns1') {
          return { data: [], isLoading: false, error: null };
        }
      }

      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('should correctly identify managed namespaces from ReleasePlans', async () => {
    const mockReleasePlans2 = [
      ...mockReleasePlans,
      {
        metadata: {
          name: 'plan-2',
          namespace: 'ns1',
          labels: {
            'release.appstudio.openshift.io/releasePlanAdmission': 'rpa-2',
          },
        },
        spec: { target: 'another-ns' },
      },
    ];

    mockUseK8sWatchResource.mockImplementation((resourceSpec, model) => {
      const { namespace } = resourceSpec || {};

      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans2, isLoading: false, error: null };
      }

      if (model === ReleasePlanAdmissionModel) {
        if (namespace === 'ns1') {
          return { data: [], isLoading: false, error: null };
        }

        if (namespace === 'target-ns') {
          return { data: mockReleasePlanAdmissions, isLoading: false, error: null };
        }

        if (namespace === 'another-ns') {
          return { data: [], isLoading: false, error: null };
        }
      }

      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      // Verify useK8sWatchResource was called for both target namespaces
      const calls = mockUseK8sWatchResource.mock.calls;

      // Should have calls for ReleasePlanAdmissionModel in both target-ns and another-ns
      const rpaCalls = calls.filter(([resourceSpec, model]) => {
        const namespace = (resourceSpec as { namespace?: string })?.namespace;
        return (
          model === ReleasePlanAdmissionModel &&
          namespace &&
          ['target-ns', 'another-ns'].includes(namespace)
        );
      });

      expect(rpaCalls).toHaveLength(2);
      expect(rpaCalls.some(call => (call[0] as { namespace: string }).namespace === 'target-ns')).toBe(true);
      expect(rpaCalls.some(call => (call[0] as { namespace: string }).namespace === 'another-ns')).toBe(true);
    });
  });

  it('should handle admissions watcher error', async () => {
    const error = new Error('Watcher error');

    mockUseK8sWatchResource.mockImplementation((resourceSpec, model) => {
      const { namespace } = resourceSpec || {};

      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans, isLoading: false, error: null };
      }

      if (model === ReleasePlanAdmissionModel) {
        if (namespace === 'ns1') {
          return { data: [], isLoading: false, error: null };
        }

        if (namespace === 'target-ns') {
          // Return an error for the target namespace
          return { data: [], isLoading: false, error };
        }
      }

      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      // Note: The real MultipleNamespaceAdmissionsWatcher filters out 403 errors
      // but passes through other errors
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('should handle 403 errors gracefully', async () => {
    // Simulate a 403 Forbidden error (which should be ignored by MultipleNamespaceAdmissionsWatcher)
    const forbiddenError = {
      code: 403,
      status: 403,
      message: 'Forbidden',
    };

    mockUseK8sWatchResource.mockImplementation((resourceSpec, model) => {
      const { namespace } = resourceSpec || {};

      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans, isLoading: false, error: null };
      }

      if (model === ReleasePlanAdmissionModel) {
        if (namespace === 'ns1') {
          return { data: [], isLoading: false, error: null };
        }

        if (namespace === 'target-ns') {
          // Return a 403 error
          return { data: [], isLoading: false, error: forbiddenError };
        }
      }

      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      // 403 errors should NOT trigger onError
      expect(onError).not.toHaveBeenCalled();
      // But releases should still be loaded (without product info from RPA)
      expect(onReleasesLoaded).toHaveBeenCalled();
    });
  });
});