import { renderHook } from '@testing-library/react-hooks';
import { ComponentKind } from '~/types';
import { BUILD_STATUS_ANNOTATION } from '~/utils/component-utils';
import { mockComponentsData } from '../../components/ApplicationDetails/__data__/WorkflowComponentsData';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useApplicationPipelineGitHubApp } from '../useApplicationPipelineGitHubApp';
import { useAllComponents, useComponents, useURLForComponentPRs } from '../useComponents';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

jest.mock('../useApplicationPipelineGitHubApp', () => ({
  useApplicationPipelineGitHubApp: jest.fn(),
}));

const useApplicationPipelineGitHubAppMock = useApplicationPipelineGitHubApp as jest.Mock;

describe('useComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return components when namespace is passed', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);

    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});

describe('useAllComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return all components in a namespace', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });

  it('should filter out deleted componets', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [...mockComponentsData, { metadata: { name: 'sdfs', deletionTimestamp: 'sad-wqe' } }],
      true,
      undefined,
    ]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});

describe('useURLForComponentPRs', () => {
  it('should create git URL for component PRs', () => {
    useApplicationPipelineGitHubAppMock.mockReturnValue({
      name: 'appstudio-staging-ci',
      url: 'https://github.com/apps/appstudio-staging-ci.git',
    });
    const createComponent = (url: string, pacEnabled = true): ComponentKind =>
      ({
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: pacEnabled && JSON.stringify({ pac: { state: 'enabled' } }),
          },
        },
        spec: {
          source: {
            git: {
              url,
            },
          },
        },
      }) as unknown as ComponentKind;

    expect(renderHook(() => useURLForComponentPRs([])).result.current).toBe(
      'https://github.com/pulls?q=is:pr+is:open+author:app/appstudio-staging-ci',
    );
    expect(
      renderHook(() =>
        useURLForComponentPRs([
          createComponent('test', false),
          createComponent('https://github.com/org/repo', false),
        ]),
      ).result.current,
    ).toBe('https://github.com/pulls?q=is:pr+is:open+author:app/appstudio-staging-ci');
    expect(
      renderHook(() =>
        useURLForComponentPRs([
          createComponent('test', true),
          createComponent('https://github.com/org/repo1', true),
          createComponent('https://github.com/org/repo2', true),
        ]),
      ).result.current,
    ).toBe(
      'https://github.com/pulls?q=is:pr+is:open+author:app/appstudio-staging-ci+repo:org/repo1+repo:org/repo2',
    );
  });
});
