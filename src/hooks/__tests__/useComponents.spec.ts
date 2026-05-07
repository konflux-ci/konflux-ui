import { renderHook } from '@testing-library/react-hooks';
import { ComponentKind } from '~/types';
import { GIT_PROVIDER_ANNOTATION, GIT_PROVIDER_ANNOTATION_VALUE } from '~/utils/component-utils';
import { mockComponentsData } from '../../components/ApplicationDetails/__data__/WorkflowComponentsData';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useAllComponents, useComponents, useURLForComponentPR } from '../useComponents';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

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

describe('useURLForComponentPR', () => {
  const createComponent = (gitProvider: string, url: string): ComponentKind =>
    ({
      metadata: {
        annotations: {
          [GIT_PROVIDER_ANNOTATION]: gitProvider,
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

  it('should create GitHub pull requests URL', () => {
    expect(
      useURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, 'https://github.com/org/repo.git'),
      ),
    ).toBe('https://github.com/org/repo/pulls');
  });

  it('should create Forgejo pull requests URL', () => {
    expect(
      useURLForComponentPR(
        createComponent(
          GIT_PROVIDER_ANNOTATION_VALUE.FORGEJO,
          'https://code.forgejo.org/org/repo.git',
        ),
      ),
    ).toBe('https://code.forgejo.org/org/repo/pulls');
  });

  it('should create GitLab merge requests URL', () => {
    expect(
      useURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITLAB, 'https://gitlab.com/org/repo.git'),
      ),
    ).toBe('https://gitlab.com/org/repo/-/merge_requests');
  });

  it('should return undefined for unsupported providers', () => {
    expect(
      useURLForComponentPR(createComponent('bitbucket', 'https://bitbucket.org/org/repo.git')),
    ).toBeUndefined();
  });

  it('should return undefined when git URL is missing', () => {
    const component = {
      metadata: {
        annotations: {
          [GIT_PROVIDER_ANNOTATION]: GIT_PROVIDER_ANNOTATION_VALUE.GITHUB,
        },
      },
      spec: {
        source: {
          git: {},
        },
      },
    } as unknown as ComponentKind;

    expect(useURLForComponentPR(component)).toBeUndefined();
  });
});
