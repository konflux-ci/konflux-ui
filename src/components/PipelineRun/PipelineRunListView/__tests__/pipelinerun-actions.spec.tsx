import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { renderHook } from '@testing-library/react-hooks';
import { PipelineRunEventType, PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useSnapshots } from '../../../../hooks/useSnapshots';
import { PipelineRunKind } from '../../../../types';
import { runStatus } from '../../../../utils/pipeline-utils';
import { useAccessReviewForModel } from '../../../../utils/rbac';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { usePipelinererunAction, usePipelinerunActions } from '../pipelinerun-actions';

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../../utils/component-utils', () => {
  return {
    isPACEnabled: () => true,
  };
});

jest.mock('../../../../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn(),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const mockUseSnapshots = useSnapshots as jest.Mock;

describe('usePipelinerunActions', () => {
  let navigateMock: jest.Mock;
  const mockWatchResource = createK8sWatchResourceMock();

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    mockUseSnapshots.mockReturnValue([[{ metadata: { name: 'snp1' } }], true]);
    mockWatchResource.mockReturnValue([[], false]);
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
    mockUseSnapshots.mockReturnValue([[{ metadata: { name: 'snp1' } }], true]);
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
});
