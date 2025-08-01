import '@testing-library/jest-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { renderHook } from '@testing-library/react-hooks';
import { PipelineRunEventType, PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useComponent } from '../../../../hooks/useComponents';
import { useSnapshot } from '../../../../hooks/useSnapshots';
import { PipelineRunKind } from '../../../../types';
import { runStatus } from '../../../../utils/pipeline-utils';
import { useAccessReviewForModel } from '../../../../utils/rbac';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { mockComponent } from '../../../Components/ComponentDetails/__data__/mockComponentDetails';
import { usePipelinererunAction, usePipelinerunActions } from '../pipelinerun-actions';

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
        disabledTooltip: 'Comment `/retest` on pull request to rerun',
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
