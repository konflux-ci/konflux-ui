import { useLocation } from 'react-router-dom';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { commonFetchJSON, getK8sResourceURL, K8sListResourceItems } from '~/k8s';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentKind } from '~/types';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import { generateMockResults } from '../__data__/mockConformaResults';
import {
  useApplicationConformaResults,
  type ApplicationConformaResults,
} from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/shared/hooks/useDeepCompareMemoize', () =>
  jest.requireActual('~/shared/hooks/useDeepCompareMemoize'),
);

jest.mock('~/k8s', () => ({
  commonFetchJSON: jest.fn(),
  getK8sResourceURL: jest.fn(() => '/fake-url'),
  K8sListResourceItems: jest.fn(),
}));

jest.mock('~/utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

jest.mock('~/components/Conforma/utils', () => ({
  extractConformaResultsFromTaskRunLogs: jest.fn(),
}));

jest.mock('~/utils/conforma-utils', () => ({
  isResourceEnterpriseContract: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  isTaskRunInPipelineRun: jest.fn(),
}));

jest.mock('~/utils/common-utils', () => ({
  getPipelineRunFromTaskRunOwnerRef: jest.fn(),
}));

jest.mock('~/hooks/useTaskRuns', () => ({
  sortTaskRunsByTime: jest.fn((v) => v),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('../__data__/mockConformaResults', () => ({
  generateMockResults: jest.fn(),
}));

const mockUseLocation = useLocation as jest.Mock;
const mockUseComponents = useComponents as jest.Mock;
const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockGenerateMockResults = generateMockResults as jest.Mock;

const createComponent = (name: string): ComponentKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Component',
  metadata: { name, namespace: 'test-ns' },
  spec: {
    application: 'test-app',
    componentName: name,
    source: { git: { url: 'https://example.com/repo.git' } },
  },
});

const mockApplicationResults: ApplicationConformaResults = {
  componentStatuses: [
    {
      componentName: 'comp-a',
      status: 'fail',
      violationCount: 1,
      warningCount: 0,
      successCount: 0,
    },
  ],
  allResults: [
    {
      title: 'Mock violation',
      description: 'Mock violation description',
      status: CONFORMA_RESULT_STATUS.violations,
      component: 'comp-a',
      msg: 'mock msg',
    },
  ],
  totalComponents: 1,
  totalFailed: 1,
  totalViolations: 1,
  totalWarnings: 0,
  totalSuccesses: 0,
  loaded: true,
  error: undefined,
};

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useApplicationConformaResults', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocation.mockReturnValue({ search: '' });
    mockUseNamespace.mockReturnValue('test-ns');
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseComponents.mockReturnValue([[], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    mockGenerateMockResults.mockReturnValue(mockApplicationResults);

    jest.mocked(K8sListResourceItems).mockResolvedValue([]);
    jest.mocked(commonFetchJSON).mockResolvedValue(undefined);
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
    jest.mocked(getTaskRunLog).mockResolvedValue('');
    jest.mocked(extractConformaResultsFromTaskRunLogs).mockReturnValue(undefined);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(false);
    jest.mocked(isTaskRunInPipelineRun).mockReturnValue(false);
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns empty initial state when namespace is empty', () => {
    mockUseNamespace.mockReturnValue('');

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(result.current).toEqual({
      componentStatuses: [],
      allResults: [],
      totalComponents: 0,
      totalFailed: 0,
      totalViolations: 0,
      totalWarnings: 0,
      totalSuccesses: 0,
      loaded: false,
      error: undefined,
    });
  });

  it('returns loading state when components are not loaded yet', () => {
    mockUseComponents.mockReturnValue([[], false, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(result.current.loaded).toBe(false);
  });

  it('returns mock data when in development mode with mock param', () => {
    process.env.NODE_ENV = 'development';
    mockUseLocation.mockReturnValue({ search: '?mock=conforma' });

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(mockGenerateMockResults).toHaveBeenCalled();
    expect(result.current).toEqual(mockApplicationResults);
  });

  it('returns loaded empty state when there are no pipeline runs', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
    expect(result.current.totalComponents).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('returns components error when useComponents has an error', async () => {
    const componentsError = new Error('comp error');
    mockUseComponents.mockReturnValue([[], true, componentsError]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(componentsError);
  });

  it('returns pipelines error when usePipelineRunsV2 has an error', async () => {
    const pipelinesError = new Error('pipeline error');
    mockUsePipelineRunsV2.mockReturnValue([[], true, pipelinesError]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(pipelinesError);
  });

  it('does not use mock data in production mode', async () => {
    process.env.NODE_ENV = 'production';
    mockUseLocation.mockReturnValue({ search: '?mock=conforma' });

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(mockGenerateMockResults).not.toHaveBeenCalled();
    expect(result.current).not.toEqual(mockApplicationResults);
    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
  });
});
