import { useNavigate } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react-hooks';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { PIPELINE_RUNS_VULNERABILITIES_PATH } from '~/routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind } from '~/types';
import { useViewVulnerabilitiesActionLazy } from '../useViewVulnerabilitiesAction';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

const useNavigateMock = useNavigate as jest.Mock;
const useNamespaceMock = useNamespace as jest.Mock;

const createPipelineRun = (overrides: Partial<PipelineRunKind> = {}): PipelineRunKind =>
  ({
    metadata: {
      name: 'pipeline-run-1',
      namespace: 'test-ns',
      labels: {
        [PipelineRunLabel.APPLICATION]: 'test-app',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
      },
    },
    status: {
      completionTime: '2026-10-04T10:00:00Z',
      conditions: [{ type: 'Succeeded', status: 'True' }],
      pipelineSpec: { tasks: [{ name: ROXCTL_SCAN_TASK }] },
    },
    ...overrides,
  }) as PipelineRunKind;

describe('useViewVulnerabilitiesActionLazy', () => {
  const navigateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigateMock.mockReturnValue(navigateMock);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('returns the View vulnerabilities action for a completed build with roxctl-scan', () => {
    const { result } = renderHook(() => useViewVulnerabilitiesActionLazy(createPipelineRun()));

    expect(result.current[0]).toEqual([
      expect.objectContaining({
        id: 'view-vulnerabilities',
        label: 'View vulnerabilities',
      }),
    ]);
  });

  it('does not return the action for an in-progress build', () => {
    const pipelineRun = createPipelineRun({
      status: {
        completionTime: undefined,
        conditions: [{ type: 'Succeeded', status: 'Unknown' }],
        pipelineSpec: { tasks: [{ name: ROXCTL_SCAN_TASK }] },
      },
    });

    const { result } = renderHook(() => useViewVulnerabilitiesActionLazy(pipelineRun));

    expect(result.current[0]).toEqual([]);
  });

  it('does not return the action when the pipeline has no roxctl-scan task', () => {
    const pipelineRun = createPipelineRun({
      status: {
        completionTime: '2026-10-04T10:00:00Z',
        conditions: [{ type: 'Succeeded', status: 'True' }],
        pipelineSpec: { tasks: [{ name: 'clair-scan' }] },
      },
    });

    const { result } = renderHook(() => useViewVulnerabilitiesActionLazy(pipelineRun));

    expect(result.current[0]).toEqual([]);
  });

  it('navigates to the PipelineRun vulnerabilities route', () => {
    const { result } = renderHook(() => useViewVulnerabilitiesActionLazy(createPipelineRun()));
    const cta = result.current[0][0].cta;

    expect(typeof cta).toBe('function');

    act(() => {
      if (typeof cta === 'function') {
        cta();
      }
    });

    expect(navigateMock).toHaveBeenCalledWith(
      PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-app',
        pipelineRunName: 'pipeline-run-1',
      }),
    );
  });
});
