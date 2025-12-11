import '@testing-library/jest-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { renderHook, act } from '@testing-library/react-hooks';
import { PipelineRunEventType, PipelineRunLabel, runStatus } from '../../../../consts/pipelinerun';
import { useComponent } from '../../../../hooks/useComponents';
import { useSnapshot } from '../../../../hooks/useSnapshots';
import { k8sQueryGetResource } from '../../../../k8s';
import { PipelineRunKind } from '../../../../types';
import { useAccessReviewForModel } from '../../../../utils/rbac';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { mockComponent } from '../../../Components/ComponentDetails/__data__/mockComponentDetails';
import {
  usePipelinererunAction,
  usePipelinerunActions,
  useRerunActionLazy,
} from '../pipelinerun-actions';

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
  };
});

jest.mock('../../../../utils/component-utils', () => {
  return {
    isPACEnabled: () => true,
    startNewBuild: jest.fn(() => Promise.resolve()),
  };
});

jest.mock('../../../../hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const mockUseSnapshots = useSnapshot as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const mockUseLocation = useLocation as jest.Mock;
const k8sQueryGetResourceMock = k8sQueryGetResource as jest.Mock;

// helper function to create location object
const createMockLocation = (pathname: string | undefined | null) => ({
  pathname: pathname || '',
  search: '',
  hash: '',
  state: {},
  key: 'test',
});

jest.mock('../../../../k8s', () => ({
  ...jest.requireActual('../../../../k8s'),
  K8sQueryPatchResource: jest.fn(() => Promise.resolve()),
  k8sQueryGetResource: jest.fn(),
}));

jest.mock('../../../../shared/providers/Namespace', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

describe('usePipelinerunActions', () => {
  let navigateMock: jest.Mock;
  const mockWatchResource = createK8sWatchResourceMock();

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    mockUseSnapshots.mockReturnValue([{ metadata: { name: 'snp1' } }, true]);
    mockWatchResource.mockReturnValue([[], false]);
    useComponentMock.mockReturnValue([mockComponent, true]);
  });

  it('should contain enabled actions', () => {
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: false,
        disabledTooltip: null,
      }),
    );

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Stop',
        disabled: false,
        disabledTooltip: undefined,
      }),
    );

    expect(actions[2]).toEqual(
      expect.objectContaining({
        label: 'Cancel',
        disabled: false,
        disabledTooltip: undefined,
      }),
    );
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  it('should contain enabled actions for Gitlab pipeline run event type', async () => {
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: 'Push',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: false,
        disabledTooltip: null,
      }),
    );

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Stop',
        disabled: false,
        disabledTooltip: undefined,
      }),
    );

    expect(actions[2]).toEqual(
      expect.objectContaining({
        label: 'Cancel',
        disabled: false,
        disabledTooltip: undefined,
      }),
    );
  });

  it('should contain disabled actions for Stop and Cancel', () => {
    useAccessReviewForModelMock.mockReturnValueOnce([true, true]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Stop',
        disabled: true,
        disabledTooltip: undefined,
      }),
    );
    expect(actions[2]).toEqual(
      expect.objectContaining({
        label: 'Cancel',
        disabled: true,
        disabledTooltip: undefined,
      }),
    );
  });

  it('should contain enabled rerun actions when PAC enabled', () => {
    useAccessReviewForModelMock.mockReturnValueOnce([true, true]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: false,
        disabledTooltip: null,
      }),
    );
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  it('should contain enabled rerun actions when PAC enabled for Gitlab pipeline run event type', async () => {
    useAccessReviewForModelMock.mockReturnValueOnce([true, true]);
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: 'Push',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: false,
        disabledTooltip: null,
      }),
    );
  });

  it('should contain disabled rerun actions for pull request builds', () => {
    useAccessReviewForModelMock.mockReturnValueOnce([true, true]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PULL,
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: true,
        disabledTooltip:
          'To rerun the build pipeline for the latest commit in this PR, comment `/retest` on the pull request',
      }),
    );
  });

  it('should contain disabled actions due to access', () => {
    useAccessReviewForModelMock.mockReturnValue([false, true]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: { labels: { 'pipelines.appstudio.openshift.io/type': 'build' } },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: true,
        disabledTooltip: "You don't have access to rerun",
      }),
    );

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Stop',
        disabled: true,
        disabledTooltip: "You don't have access to stop this pipeline",
      }),
    );

    expect(actions[2]).toEqual(
      expect.objectContaining({
        label: 'Cancel',
        disabled: true,
        disabledTooltip: "You don't have access to cancel this pipeline",
      }),
    );
  });

  it('should contain enabled Rerun action for test pipelinerun if scenario & snapsht', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: false,
      }),
    );
  });

  it('should contain disabled Rerun action if scenario not specified', () => {
    useAccessReviewForModelMock.mockReturnValue([false, false]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: true,
        disabledTooltip: "You don't have access to rerun",
      }),
    );
  });

  it('should contain disabled Rerun action if test pipelinerun and not allowed to patch snapshot', () => {
    useAccessReviewForModelMock.mockReturnValue([false, false]);
    const { result } = renderHook(() =>
      usePipelinerunActions({
        metadata: { labels: { 'pipelines.appstudio.openshift.io/type': 'test' } },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Rerun',
        disabled: true,
        disabledTooltip: "You don't have access to rerun",
      }),
    );
  });
});

describe('usePipelinererunAction', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    mockUseSnapshots.mockReturnValue([[{ metadata: { name: 'snp1' } }], true, null]);
  });

  it('should contain disabled rerurn action & tooltip for build plr without access', () => {
    useAccessReviewForModelMock.mockReturnValue([false, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: { labels: { 'pipelines.appstudio.openshift.io/type': 'build' } },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: "You don't have access to rerun",
      }),
    );

    expect(action.cta).toBeDefined();
  });

  it('should contain enabled rerun action & tooltip for test plr', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: false,
        disabledTooltip: null,
      }),
    );

    expect(action.cta).toBeDefined();
  });

  it('should contain disabled rerun action when scenario missing', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Missing snapshot or scenario',
      }),
    );

    expect(action.cta).toBeDefined();
  });

  it('should contain disabled rerun action when snapshot missing', () => {
    mockUseSnapshots.mockReturnValue([undefined, true, null]);
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Missing snapshot or scenario',
      }),
    );

    expect(action.cta).toBeDefined();
  });

  it('should contain correct key', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        key: 'rerun',
      }),
    );
  });

  it('should contain correct label', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        label: 'Rerun',
      }),
    );
  });

  it('should contain disabled rerun action if run type is "tenant"', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'tenant',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot re-run pipeline run for the type tenant',
      }),
    );
  });

  it('should contain disabled rerun action if run type is "managed"', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'managed',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot re-run pipeline run for the type managed',
      }),
    );
  });

  it('should contain disabled rerun action if run type is "release"', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'release',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot re-run pipeline run for the type release',
      }),
    );
  });

  it('should contain disabled rerun action if run type is "final"', () => {
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    const { result } = renderHook(() =>
      usePipelinererunAction({
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'final',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind),
    );
    const action = result.current;

    expect(action).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot re-run pipeline run for the type final',
      }),
    );
  });

  describe('Integration Tests Page Navigation', () => {
    beforeEach(() => {
      navigateMock = jest.fn();
      useNavigateMock.mockImplementation(() => navigateMock);
      mockUseSnapshots.mockReturnValue([
        {
          metadata: { name: 'snp1', labels: { 'appstudio.redhat.com/component': 'test-comp' } },
          spec: { application: 'test-app' },
        },
        true,
        null,
      ]);
      useAccessReviewForModelMock.mockReturnValue([true, true]);
      useComponentMock.mockReturnValue([mockComponent, true]);
    });

    it('should skip navigation when rerunning test from integration tests page', async () => {
      // mock location to simulate being on integration tests page
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/app/integrationtests'),
      );

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      await action.cta();

      expect(mockUseLocation).toHaveBeenCalled();

      // verify navigation was not called
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should navigate normally when rerunning test from non-integration tests page', async () => {
      // mock location to simulate being on pipeline runs page
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/activity/pipelineruns'),
      );

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      await action.cta();

      expect(mockUseLocation).toHaveBeenCalled();

      // verify navigation was called with correct path
      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining('/applications/test-app/activity/pipelineruns'),
      );
    });

    it('should still navigate for build pipeline runs regardless of page', async () => {
      // mock location to be on integration tests page
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/app/integrationtests'),
      );

      useComponentMock.mockReturnValue([mockComponent, true]);

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'build',
              [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      expect(mockUseLocation).toHaveBeenCalled();

      await action.cta();

      // verify navigation was called (build pipelines should always navigate)
      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining('/applications/test-application/activity/pipelineruns'),
      );
    });

    it('should handle edge case where pathname is undefined', async () => {
      // mock location with undefined pathname
      mockUseLocation.mockReturnValue(createMockLocation(undefined));

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      await action.cta();

      expect(mockUseLocation).toHaveBeenCalled();

      // should navigate normally when pathname is undefined (not integration tests page)
      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining('/applications/test-app/activity/pipelineruns'),
      );
    });

    it('should explicitly cover useLocation destructuring with different scenarios', () => {
      // Test multiple pathname scenarios to ensure the `const { pathname } = useLocation();` line gets covered
      const testScenarios = [
        '/ns/test-ns/applications/app/integrationtests',
        '/ns/test-ns/applications/app/pipelineruns',
        undefined,
        null,
        '',
      ];

      for (const pathname of testScenarios) {
        mockUseLocation.mockClear();

        mockUseLocation.mockReturnValue(createMockLocation(pathname));

        const { result } = renderHook(() =>
          usePipelinererunAction({
            metadata: {
              labels: {
                'pipelines.appstudio.openshift.io/type': 'test',
                [PipelineRunLabel.SNAPSHOT]: 'snp1',
                [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
              },
            },
            status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
          } as unknown as PipelineRunKind),
        );

        // verify the hook executed and returned a valid result
        expect(mockUseLocation).toHaveBeenCalled();
        expect(result.current).toBeDefined();
        expect(result.current.key).toBe('rerun');
      }
    });
  });

  describe('Snapshots Page Navigation', () => {
    // extract pipeline run objects to reduce nesting
    const buildPipelineRun = {
      metadata: {
        labels: {
          'pipelines.appstudio.openshift.io/type': 'build',
          [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
        },
      },
      status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
    } as unknown as PipelineRunKind;

    const testPipelineRun = {
      metadata: {
        labels: {
          'pipelines.appstudio.openshift.io/type': 'test',
          [PipelineRunLabel.SNAPSHOT]: 'snp1',
          [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
        },
      },
      status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
    } as unknown as PipelineRunKind;

    beforeEach(() => {
      navigateMock = jest.fn();
      useNavigateMock.mockImplementation(() => navigateMock);
      mockUseSnapshots.mockReturnValue([
        {
          metadata: { name: 'snp1', labels: { 'appstudio.redhat.com/component': 'test-comp' } },
          spec: { application: 'test-app' },
        },
        true,
        null,
      ]);
      useAccessReviewForModelMock.mockReturnValue([true, true]);
      useComponentMock.mockReturnValue([mockComponent, true]);
    });

    it('should skip navigation when rerunning BUILD pipeline from snapshots page', async () => {
      mockUseLocation.mockReturnValue(createMockLocation('/ns/test-ns/applications/app/snapshots'));

      const { result } = renderHook(() => usePipelinererunAction(buildPipelineRun));
      const action = result.current;

      expect(action.isDisabled).toBe(false);
      expect(mockUseLocation).toHaveBeenCalled();

      await action.cta();
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should skip navigation when rerunning TEST pipeline from snapshots page', async () => {
      mockUseLocation.mockReturnValue(createMockLocation('/ns/test-ns/applications/app/snapshots'));

      const { result } = renderHook(() => usePipelinererunAction(testPipelineRun));
      const action = result.current;

      expect(action.isDisabled).toBe(false);
      expect(mockUseLocation).toHaveBeenCalled();

      await action.cta();
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should navigate normally when rerunning BUILD pipeline from non-snapshots page', async () => {
      // mock location to simulate being on pipeline runs page
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/app/pipelineruns'),
      );

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'build',
              [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      expect(mockUseLocation).toHaveBeenCalled();

      await action.cta();

      // verify navigation was called with correct path
      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining('/applications/test-application/activity/pipelineruns'),
      );
    });

    it('should navigate normally when rerunning TEST pipeline from non-snapshots page', async () => {
      // mock location to simulate being on pipeline runs page
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/app/pipelineruns'),
      );

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      const action = result.current;
      expect(action.isDisabled).toBe(false);

      expect(mockUseLocation).toHaveBeenCalled();

      await action.cta();

      // verify navigation was called with correct path
      expect(navigateMock).toHaveBeenCalledWith(
        expect.stringContaining('/applications/test-app/activity/pipelineruns'),
      );
    });

    it('should skip navigation for standard snapshots page', async () => {
      navigateMock.mockClear();
      mockUseLocation.mockReturnValue(createMockLocation('/ns/test-ns/applications/app/snapshots'));

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      await result.current.cta();
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it('should navigate normally for pipeline runs page', async () => {
      navigateMock.mockClear();
      mockUseLocation.mockReturnValue(
        createMockLocation('/ns/test-ns/applications/app/pipelineruns'),
      );

      const { result } = renderHook(() =>
        usePipelinererunAction({
          metadata: {
            labels: {
              'pipelines.appstudio.openshift.io/type': 'test',
              [PipelineRunLabel.SNAPSHOT]: 'snp1',
              [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            },
          },
          status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
        } as unknown as PipelineRunKind),
      );

      await result.current.cta();
      expect(navigateMock).toHaveBeenCalled();
    });
  });
});

describe('useRerunActionLazy', () => {
  const mockSnapshot = {
    metadata: { name: 'snp1', namespace: 'test-ns' },
    spec: { application: 'test-app' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue(
      createMockLocation('/ns/test-ns/applications/app/pipelineruns'),
    );
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    k8sQueryGetResourceMock.mockReset();
  });

  describe('snapshot fetch error handling', () => {
    it('should catch snapshot fetch error and set snapshot to null', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      k8sQueryGetResourceMock.mockRejectedValueOnce(new Error('Snapshot not found'));

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      // open menu to trigger lazy loading (loadContext will be called)
      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      // after error is caught in try-catch, snapshot should be null and action should be disabled
      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: true,
          disabledTooltip: 'Missing snapshot or scenario',
        }),
      );

      // verify snapshot fetch was attempted
      expect(k8sQueryGetResourceMock).toHaveBeenCalledWith({
        model: expect.any(Object),
        queryOptions: { ns: 'test-ns', name: 'snp1' },
      });
      expect(k8sQueryGetResourceMock).toHaveBeenCalledTimes(1);
    });

    it('should catch 404 error when snapshot is not found', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'missing-snapshot',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      const httpError = new Error('Not Found') as Error & { code?: number };
      httpError.code = 404;
      k8sQueryGetResourceMock.mockRejectedValueOnce(httpError);

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: true,
          disabledTooltip: 'Missing snapshot or scenario',
        }),
      );
    });

    it('should work correctly when snapshot fetch succeeds (no error)', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'test',
            [PipelineRunLabel.SNAPSHOT]: 'snp1',
            [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'scn1',
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      k8sQueryGetResourceMock.mockResolvedValueOnce(mockSnapshot);

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      // after successful fetch, snapshot should be set and action enabled
      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: false,
          disabledTooltip: undefined,
        }),
      );

      // verify snapshot fetch was called successfully
      expect(k8sQueryGetResourceMock).toHaveBeenCalledWith({
        model: expect.any(Object),
        queryOptions: { ns: 'test-ns', name: 'snp1' },
      });
    });
  });

  describe('component fetch error handling', () => {
    it('should catch component fetch error and set component to null', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMPONENT]: 'test-component',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      k8sQueryGetResourceMock.mockRejectedValueOnce(new Error('Component not found'));

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      // open menu to trigger lazy loading
      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      // after error is caught in try-catch, component should be null and action should be disabled
      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: true,
          disabledTooltip: 'Component not available',
        }),
      );

      // verify component fetch was attempted
      expect(k8sQueryGetResourceMock).toHaveBeenCalledWith({
        model: expect.any(Object),
        queryOptions: { ns: 'test-ns', name: 'test-component' },
      });
      expect(k8sQueryGetResourceMock).toHaveBeenCalledTimes(1);
    });

    it('should catch 404 error when component is not found', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMPONENT]: 'missing-component',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      const httpError = new Error('Not Found') as Error & { code?: number };
      httpError.code = 404;
      k8sQueryGetResourceMock.mockRejectedValueOnce(httpError);

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      // error should be caught, component set to null, action disabled
      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: true,
          disabledTooltip: 'Component not available',
        }),
      );
    });

    it('should work correctly when component fetch succeeds (no error)', async () => {
      const pipelineRun = {
        metadata: {
          labels: {
            'pipelines.appstudio.openshift.io/type': 'build',
            [PipelineRunLabel.COMPONENT]: 'test-component',
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
            [PipelineRunLabel.APPLICATION]: 'test-app',
          },
        },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as unknown as PipelineRunKind;

      k8sQueryGetResourceMock.mockResolvedValueOnce(mockComponent);

      const { result } = renderHook(() => useRerunActionLazy(pipelineRun));

      await act(async () => {
        const [, onOpen] = result.current;
        onOpen(true);
        await Promise.resolve();
      });

      // after successful fetch, component should be set and action enabled
      const [actions] = result.current;
      expect(actions[0]).toEqual(
        expect.objectContaining({
          disabled: false,
          disabledTooltip: undefined,
        }),
      );

      // verify component fetch was called successfully
      expect(k8sQueryGetResourceMock).toHaveBeenCalledWith({
        model: expect.any(Object),
        queryOptions: { ns: 'test-ns', name: 'test-component' },
      });
    });
  });
});
