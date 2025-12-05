import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { useK8sWatchResource } from '~/k8s';
import { ReleasePlanAdmissionModel, ReleasePlanModel } from '~/models';
import { MultipleNamespaceAdmissionsWatcher } from '../MultipleNamespaceAdmissionsWatcher';
import ReleasesInNamespace from '../ReleasesInNamespace';

jest.mock('~/hooks/useK8sAndKarchResources');
jest.mock('~/k8s', () => ({
  useK8sWatchResource: jest.fn(),
}));
jest.mock('../MultipleNamespaceAdmissionsWatcher');

const mockUseK8sAndKarchResources = useK8sAndKarchResources as jest.Mock;
const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockMultipleNamespaceAdmissionsWatcher = MultipleNamespaceAdmissionsWatcher as jest.Mock;

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
            // eslint-disable-next-line camelcase
            product_name: 'Test Product',
            // eslint-disable-next-line camelcase
            product_version: '1.0',
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

    mockUseK8sWatchResource.mockImplementation((_init, model) => {
      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans, isLoading: false, error: null };
      }
      if (model === ReleasePlanAdmissionModel) {
        return { data: [], isLoading: false, error: null }; // Local RPAs
      }
      return { data: [], isLoading: false, error: null };
    });

    mockMultipleNamespaceAdmissionsWatcher.mockImplementation(({ onUpdate }) => {
      // Simulate that watcher found the RPA in the target namespace
      React.useEffect(() => {
        onUpdate(mockReleasePlanAdmissions, false, null);
      }, [onUpdate]);
      return null;
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

  it('should handle individual errors (only cluster error)', async () => {
    // If only cluster error, it might still return data from archive or vice versa?
    // But the logic `(releasesClusterError && releasesArchiveError)` suggests we tolerate one failing if the other works?
    // Actually useK8sAndKarchResources likely handles the combination.
    // If both fail, then we error.

    mockUseK8sAndKarchResources.mockReturnValue({
      data: [],
      isLoading: false,
      clusterError: new Error('Cluster error'),
      archiveError: null,
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    // Should load (empty) releases or whatever data is returned
    // Here data is empty array
    await waitFor(() => {
      expect(onReleasesLoaded).toHaveBeenCalledWith([]);
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('should handle ReleasePlans error', async () => {
    const error = new Error('RP error');
    mockUseK8sWatchResource.mockImplementation((_init, model) => {
      if (model === ReleasePlanModel) {
        return { data: null, isLoading: false, error };
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
    mockReleasePlans[0].spec.target = 'target-ns';
    const mockReleasePlans2 = [
      ...mockReleasePlans,
      {
        metadata: { name: 'plan-2', namespace: 'ns1' },
        spec: { target: 'another-ns' },
      },
    ];

    mockUseK8sWatchResource.mockImplementation((_init, model) => {
      if (model === ReleasePlanModel) {
        return { data: mockReleasePlans2, isLoading: false, error: null };
      }
      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      expect(mockMultipleNamespaceAdmissionsWatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          namespaces: expect.arrayContaining(['target-ns', 'another-ns']),
        }),
        expect.anything(),
      );
    });
  });

  it('should use current namespace if target is missing in ReleasePlan', async () => {
    const localPlan = {
      metadata: { name: 'plan-local', namespace: 'ns1' },
      spec: { target: undefined }, // No target
    };

    mockUseK8sWatchResource.mockImplementation((_init, model) => {
      if (model === ReleasePlanModel) {
        return { data: [localPlan], isLoading: false, error: null };
      }
      return { data: [], isLoading: false, error: null };
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      expect(mockMultipleNamespaceAdmissionsWatcher).toHaveBeenCalledWith(
        expect.objectContaining({
          namespaces: expect.arrayContaining(['ns1']),
        }),
        expect.anything(),
      );
    });
  });

  it('should handle admissions watcher error', async () => {
    const error = new Error('Watcher error');
    mockMultipleNamespaceAdmissionsWatcher.mockImplementation(({ onUpdate }) => {
      React.useEffect(() => {
        onUpdate([], false, error);
      }, [onUpdate]);
      return null;
    });

    render(
      <ReleasesInNamespace namespace="ns1" onReleasesLoaded={onReleasesLoaded} onError={onError} />,
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
