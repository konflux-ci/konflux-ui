import { renderHook } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { PipelineRunGroupVersionKind } from '../../models';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { useComponents } from '../useComponents';
import { usePipelineRunsForCommitV2 } from '../usePipelineRunsForCommitV2';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useComponents');
jest.mock('../useTektonResults');
jest.mock('~/kubearchive/hooks');
jest.mock('~/kubearchive/conditional-checks', () => ({
  createConditionsHook: jest.fn(() => jest.fn()),
  ensureConditionIsOn: jest.fn(() => jest.fn()),
}));
jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const mockUseComponents = useComponents as jest.Mock;
const mockUseTRPipelineRuns = useTRPipelineRuns as jest.Mock;
const mockUseK8sWatchResource = createK8sWatchResourceMock();
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseKubearchiveListResourceQuery = useKubearchiveListResourceQuery as jest.MockedFunction<
  typeof useKubearchiveListResourceQuery
>;

const resultMock = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      name: 'first',
      uid: 'uid-1',
      creationTimestamp: '2023-04-11T19:36:25Z',
      labels: {
        'pipelinesascode.tekton.dev/sha': 'sample-sha',
        'appstudio.openshift.io/component': 'test-component',
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      name: 'second',
      uid: 'uid-2',
      creationTimestamp: '2022-04-11T19:36:25Z',
      labels: {
        'pac.test.appstudio.openshift.io/sha': 'sample-sha',
        'appstudio.openshift.io/component': 'test-component',
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      name: 'plr-alt',
      uid: 'uid-3',
      creationTimestamp: '2022-04-11T19:36:25Z',
      labels: {
        'pipelinesascode.tekton.dev/sha': 'sample-sha',
        'appstudio.openshift.io/component': 'test-component-alt',
      },
    },
  },
];

describe('usePipelineRunsForCommitV2', () => {
  mockUseNamespaceHook('test-ns');
  mockUseK8sWatchResource.mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockImplementation((flag: string) => {
      return flag === 'pipelineruns-kubearchive';
    });
  });

  describe('when using KubeArchive (feature flag enabled)', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(true);
    });

    it('should return pipeline runs from KubeArchive', () => {
      mockUseComponents.mockReturnValue([[{ metadata: { name: 'test-component' } }], true]);

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [[resultMock[0]]],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        [resultMock[0]],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    });

    it('should filter by components when filterByComponents is true', () => {
      const components = [{ metadata: { name: 'test-component' } }];
      mockUseComponents.mockReturnValue([components, true]);

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [resultMock],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        [resultMock[0], resultMock[1]],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    });

    it('should not filter by components when filterByComponents is false', () => {
      const components = [
        { metadata: { name: 'test-component-1' } },
        { metadata: { name: 'test-component-2' } },
      ];
      mockUseComponents.mockReturnValue([components, true]);

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: {
          pages: [resultMock],
          pageParams: [],
        },
        isLoading: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha', 10, false),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(mockUseKubearchiveListResourceQuery).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        resultMock,
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    });

    it('should handle loading state', () => {
      mockUseComponents.mockReturnValue([[], false]);

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(result.current).toEqual([[], false, null, undefined, undefined]);
    });
    it('should handle error', () => {
      const error = new Error('Kubearchive error');
      mockUseComponents.mockReturnValue([[], false]);

      // @ts-expect-error - Mocking partial infinite query result for testing
      mockUseKubearchiveListResourceQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: undefined,
      });

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(result.current).toEqual([[], true, error, undefined, undefined]);
    });
  });

  describe('when using Tekton Results (feature flag disabled)', () => {
    beforeEach(() => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
    });

    it('should return pipeline runs from Tekton Results', () => {
      const mockGetNextPage = jest.fn();
      const mockNextPageProps = { hasNextPage: true, isFetchingNextPage: false };

      mockUseComponents.mockReturnValue([[{ metadata: { name: 'test-component' } }], true]);
      mockUseTRPipelineRuns.mockReturnValue([
        [resultMock[0]],
        true,
        null,
        mockGetNextPage,
        mockNextPageProps,
      ]);

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        [resultMock[0]],
        true,
        null,
        mockGetNextPage,
        mockNextPageProps,
      ]);
    });

    it('should filter by components when filterByComponents is true', () => {
      const components = [{ metadata: { name: 'test-component' } }];
      mockUseComponents.mockReturnValue([components, true]);
      mockUseTRPipelineRuns.mockReturnValue([
        resultMock,
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(mockUseTRPipelineRuns).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        [resultMock[0], resultMock[1]],
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    });

    it('should not filter by components when filterByComponents is false', () => {
      const components = [
        { metadata: { name: 'test-component-1' } },
        { metadata: { name: 'test-component-2' } },
      ];
      mockUseComponents.mockReturnValue([components, true]);

      mockUseTRPipelineRuns.mockReturnValue([
        resultMock,
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha', 10, false),
      );

      expect(mockUseK8sWatchResource).toHaveBeenCalledTimes(1);
      expect(mockUseTRPipelineRuns).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual([
        resultMock,
        true,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    });

    it('should handle loading state', () => {
      mockUseComponents.mockReturnValue([[], false]);
      mockUseTRPipelineRuns.mockReturnValue([
        [],
        false,
        null,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(result.current).toEqual([[], false, null, undefined, undefined]);
    });

    it('should handle error', () => {
      const error = new Error('TR error');
      mockUseComponents.mockReturnValue([[], false]);
      mockUseTRPipelineRuns.mockReturnValue([
        null,
        false,
        error,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { result } = renderHook(() =>
        usePipelineRunsForCommitV2('test-ns', 'test-app', 'sample-sha'),
      );

      expect(result.current).toEqual([[], false, error, undefined, undefined]);
    });
  });
});
