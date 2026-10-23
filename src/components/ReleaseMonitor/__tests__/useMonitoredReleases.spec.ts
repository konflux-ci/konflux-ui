import { waitFor } from '@testing-library/react';
import { K8sListResourceItems, K8sResourceListOptions } from '~/k8s/k8s-fetch';
import { useIsKubeArchiveEnabled } from '~/kubearchive/conditional-checks';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { ReleaseModel, ReleasePlanModel } from '~/models';
import { ReleasePlanAdmissionModel } from '~/models/release-plan-admission';
import { ReleaseCondition, ReleaseKind } from '~/types';
import { ReleasePlanKind, ReleasePlanLabel } from '~/types/coreBuildService';
import { K8sResourceCommon } from '~/types/k8s';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';
import { createTestQueryClient, renderHookWithQueryClient } from '~/unit-test-utils';
import { useMonitoredReleases } from '../useMonitoredReleases';

jest.mock('~/k8s/k8s-fetch', () => ({
  ...jest.requireActual('~/k8s/k8s-fetch'),
  K8sListResourceItems: jest.fn(),
}));

jest.mock('~/kubearchive/conditional-checks', () => ({
  ...jest.requireActual('~/kubearchive/conditional-checks'),
  useIsKubeArchiveEnabled: jest.fn(),
}));

const mockListResourceItems = K8sListResourceItems as jest.Mock;
const mockUseIsKubeArchiveEnabled = useIsKubeArchiveEnabled as jest.Mock;

const createRelease = (name: string, namespace: string, releasePlan: string): ReleaseKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: { name, namespace, creationTimestamp: '2023-01-01T00:00:00Z' },
  spec: { releasePlan, snapshot: `${name}-snapshot` },
  status: {
    conditions: [
      { message: '', reason: 'Succeeded', status: 'True', type: ReleaseCondition.Released },
    ],
  },
});

const createReleasePlan = (
  name: string,
  namespace: string,
  target: string,
  admissionName?: string,
): ReleasePlanKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'ReleasePlan',
  metadata: {
    name,
    namespace,
    ...(admissionName
      ? { labels: { [ReleasePlanLabel.RELEASE_PLAN_ADMISSION]: admissionName } }
      : {}),
  },
  spec: { application: 'test-app', target },
});

const createReleasePlanAdmission = (
  name: string,
  namespace: string,
  productName: string,
  productVersion: string,
): ReleasePlanAdmissionKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'ReleasePlanAdmission',
  metadata: { name, namespace },
  spec: {
    applications: ['test-app'],
    origin: 'dev-ns',
    releaseStrategy: 'test-strategy',
    data: {
      // Quoted so the snake_case API field names do not read as camelcase violations.
      releaseNotes: { ['product_name']: productName, ['product_version']: productVersion },
    },
  },
});

/** The list request the hook issued, reduced to what the fixtures need to branch on. */
type ListRequest = { kind: string; ns: string; fromArchive: boolean };

const toListRequest = (args: K8sResourceListOptions): ListRequest => ({
  kind: args.model.kind,
  ns: args.queryOptions?.ns,
  fromArchive: args.fetchOptions?.requestInit?.pathPrefix === KUBEARCHIVE_PATH_PREFIX,
});

/**
 * Answers every list request of the hook from the given fixtures, so a test only has to
 * describe the resources that exist rather than the order they are fetched in.
 */
const respondWith = (
  resolve: (request: ListRequest) => K8sResourceCommon[] | Promise<K8sResourceCommon[]>,
) => {
  mockListResourceItems.mockImplementation((args: K8sResourceListOptions) =>
    Promise.resolve(resolve(toListRequest(args))),
  );
};

const renderUseMonitoredReleases = (namespaces: string[]) =>
  renderHookWithQueryClient(() => useMonitoredReleases(namespaces), {
    client: createTestQueryClient(),
  });

describe('useMonitoredReleases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsKubeArchiveEnabled.mockReturnValue({
      isKubearchiveEnabled: true,
      isConditionsLoading: false,
    });
  });

  it('enriches releases with the product data of their release plan admission', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return [createReleasePlan('plan-1', ns, 'managed-ns', 'admission-1')];
      }
      return [createReleasePlanAdmission('admission-1', ns, 'Test Product', '1.0')];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeUndefined();
    expect(result.current.releases).toHaveLength(1);
    expect(result.current.releases[0]).toEqual(
      expect.objectContaining({
        product: 'Test Product',
        productVersion: '1.0',
        rpa: 'admission-1',
      }),
    );
    expect(mockListResourceItems).toHaveBeenCalledWith(
      expect.objectContaining({
        model: ReleasePlanAdmissionModel,
        queryOptions: expect.objectContaining({ ns: 'managed-ns' }),
      }),
    );
  });

  it('leaves the product data empty when the release plan has no admission', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return [createReleasePlan('plan-1', ns, 'managed-ns')];
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.releases).toHaveLength(1);
    expect(result.current.releases[0]).toEqual(
      expect.objectContaining({ product: undefined, productVersion: undefined, rpa: '' }),
    );
  });

  it('fetches every requested namespace and keeps the archived releases the cluster misses', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive
          ? [createRelease(`archived-${ns}`, ns, 'plan-1')]
          : [createRelease(`live-${ns}`, ns, 'plan-1')];
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns-1', 'dev-ns-2']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.releases.map((release) => release.metadata.name)).toEqual([
      'live-dev-ns-1',
      'live-dev-ns-2',
      'archived-dev-ns-1',
      'archived-dev-ns-2',
    ]);
  });

  it('keeps the cluster copy of a release that is also archived', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        const release = createRelease('release-1', ns, 'plan-1');
        return [
          fromArchive
            ? { ...release, spec: { ...release.spec, snapshot: 'archived-snapshot' } }
            : release,
        ];
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.releases).toHaveLength(1);
    expect(result.current.releases[0].spec.snapshot).toBe('release-1-snapshot');
  });

  it('does not query the archive when KubeArchive is disabled', async () => {
    mockUseIsKubeArchiveEnabled.mockReturnValue({
      isKubearchiveEnabled: false,
      isConditionsLoading: false,
    });
    respondWith(({ kind, ns }) =>
      kind === ReleaseModel.kind ? [createRelease('release-1', ns, 'plan-1')] : [],
    );

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.releases).toHaveLength(1);
    expect(mockListResourceItems).not.toHaveBeenCalledWith(
      expect.objectContaining({
        fetchOptions: { requestInit: { pathPrefix: KUBEARCHIVE_PATH_PREFIX } },
      }),
    );
  });

  it('returns nothing and never fetches when there are no namespaces', () => {
    respondWith(() => []);

    const { result } = renderUseMonitoredReleases([]);

    expect(result.current).toEqual({ releases: [], isLoading: false, error: undefined });
    expect(mockListResourceItems).not.toHaveBeenCalled();
  });

  it('ignores a failing release source as long as the other one answers', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        if (fromArchive) {
          return Promise.reject(new Error('archive is down'));
        }
        return [createRelease('release-1', ns, 'plan-1')];
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeUndefined();
    expect(result.current.releases).toHaveLength(1);
  });

  it('reports the archive error when both release sources fail', async () => {
    respondWith(({ kind, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return Promise.reject(new Error(fromArchive ? 'archive is down' : 'cluster is down'));
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.error).toBeDefined());

    // The replaced component surfaced `clusterError && archiveError`, i.e. the archive one.
    expect(result.current.error).toEqual(new Error('archive is down'));
  });

  it('reports an error when the release plans fail', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return Promise.reject(new Error('release plans are unavailable'));
      }
      return [];
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error).toEqual(new Error('release plans are unavailable'));
  });

  it('treats a forbidden target namespace as having no release plan admissions', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return [createReleasePlan('plan-1', ns, 'managed-ns', 'admission-1')];
      }
      return Promise.reject(Object.assign(new Error('forbidden'), { code: 403 }));
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeUndefined();
    expect(result.current.releases).toEqual([
      expect.objectContaining({
        product: undefined,
        productVersion: undefined,
        rpa: 'admission-1',
      }),
    ]);
  });

  it('reports a non permission error of the release plan admissions', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return [createReleasePlan('plan-1', ns, 'managed-ns', 'admission-1')];
      }
      return Promise.reject(Object.assign(new Error('server error'), { code: 500 }));
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    await waitFor(() => expect(result.current.error).toBeDefined());

    expect(result.current.error).toEqual(expect.objectContaining({ code: 500 }));
  });

  it('stays loading until the release plan admissions have resolved', async () => {
    respondWith(({ kind, ns, fromArchive }) => {
      if (kind === ReleaseModel.kind) {
        return fromArchive ? [] : [createRelease('release-1', ns, 'plan-1')];
      }
      if (kind === ReleasePlanModel.kind) {
        return [createReleasePlan('plan-1', ns, 'managed-ns', 'admission-1')];
      }
      return new Promise<K8sResourceCommon[]>((resolve) =>
        setTimeout(
          () => resolve([createReleasePlanAdmission('admission-1', ns, 'Late', '2.0')]),
          0,
        ),
      );
    });

    const { result } = renderUseMonitoredReleases(['dev-ns']);

    expect(result.current).toEqual({ releases: [], isLoading: true, error: undefined });

    // The releases must not be published half enriched while the admissions are in flight.
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.releases).toEqual([
      expect.objectContaining({ product: 'Late', productVersion: '2.0' }),
    ]);
  });
});
