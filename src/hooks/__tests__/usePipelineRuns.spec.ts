import { renderHook } from '@testing-library/react-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../../models';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useLatestBuildPipelineRunForComponent } from '../usePipelineRuns';
import { useTRPipelineRuns } from '../useTektonResults';

jest.mock('../useTektonResults');
jest.mock('~/feature-flags/hooks');
jest.mock('~/kubearchive/hooks');

const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;
const useK8sWatchResourceMock = createK8sWatchResourceMock();

const resultMock = [
  {
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      name: 'first',
      creationTimestamp: '2023-04-11T19:36:25Z',
      labels: {
        'pipelinesascode.tekton.dev/sha': 'sample-sha',
        'appstudio.openshift.io/component': 'test-component',
      },
    },
  },
  {
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      name: 'second',
      creationTimestamp: '2022-04-11T19:36:25Z',
      labels: {
        'pac.test.appstudio.openshift.io/sha': 'sample-sha',
        'appstudio.openshift.io/component': 'test-component',
      },
    },
  },
];

describe('useLatestBuildPipelineRunForComponent', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create specific selector', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);
    useTRPipelineRunsMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() =>
      useLatestBuildPipelineRunForComponent('test-ns', 'sample-component'),
    );

    expect(result.current).toEqual([undefined, false, undefined]);

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: PipelineRunGroupVersionKind,
        namespace: 'test-ns',
        isList: true,
        selector: {
          matchLabels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            'appstudio.openshift.io/component': 'sample-component',
          },
        },
        watch: true,
      },
      PipelineRunModel,
      { retry: false },
    );
    expect(useTRPipelineRunsMock).toHaveBeenCalledWith('test-ns', {
      limit: 1,
      selector: {
        matchLabels: {
          'pipelines.appstudio.openshift.io/type': 'build',
          'appstudio.openshift.io/component': 'sample-component',
        },
      },
    });
  });

  it('should return a single pipeline run', () => {
    useK8sWatchResourceMock.mockReturnValue([resultMock, true]);
    const { result } = renderHook(() =>
      useLatestBuildPipelineRunForComponent('test-ns', 'sample-component'),
    );
    expect(result.current).toEqual([resultMock[0], true, undefined]);
  });
});
