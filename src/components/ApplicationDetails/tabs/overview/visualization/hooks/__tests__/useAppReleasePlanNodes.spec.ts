import { renderHook } from '@testing-library/react-hooks';
import { useReleasePlans } from '../../../../../../../hooks/useReleasePlans';
import { useReleases } from '../../../../../../../hooks/useReleases';
import { runStatus } from '../../../../../../../utils/pipeline-utils';
import { mockReleasePlansData, mockReleasesData } from '../../../../../__data__';
import { useAppReleasePlanNodes } from '../useAppReleasePlanNodes';

jest.mock('../../../../../../../hooks/useReleasePlans', () => ({
  useReleasePlans: jest.fn(),
}));

jest.mock('../../../../../../../hooks/useReleases', () => ({
  useReleases: jest.fn(),
}));

const useReleasePlansMock = useReleasePlans as jest.Mock;
const useReleasesMock = useReleases as jest.Mock;

describe('useAppReleasePlanNodes', () => {
  beforeEach(() => {
    useReleasePlansMock.mockReturnValue([mockReleasePlansData, true, undefined]);
    useReleasesMock.mockReturnValue([mockReleasesData, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return release plan nodes with releases', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes, group, loaded, errors] = result.current;

    expect(loaded).toBe(true);
    expect(errors).toHaveLength(0);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].label).toBe('sre-production');
    expect(group).toBeDefined();
    expect(group.label).toBe('Managed environments');
  });

  it('should return nodes with correct status from latest release', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes[0].data.status).toBe(runStatus.Succeeded);
  });

  it('should return pending status when no releases exist', () => {
    useReleasesMock.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes[0].data.status).toBe(runStatus.Pending);
  });

  it('should return empty node when no release plans exist', () => {
    useReleasePlansMock.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', ['prev-task'], false),
    );
    const [nodes, group] = result.current;

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('no-managed-environments');
    expect(nodes[0].label).toBe('No managed environments set');
    expect(nodes[0].data.isDisabled).toBe(true);
    expect(group.label).toBe('No managed environments yet');
  });

  it('should handle loading state', () => {
    useReleasePlansMock.mockReturnValue([[], false, undefined]);
    useReleasesMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, , loaded] = result.current;

    expect(loaded).toBe(false);
  });

  it('should handle errors from useReleasePlans', () => {
    const error = new Error('Release plans error');
    useReleasePlansMock.mockReturnValue([[], true, error]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, , , errors] = result.current;

    expect(errors).toContain(error);
  });

  it('should handle errors from useReleases', () => {
    const error = new Error('Releases error');
    useReleasesMock.mockReturnValue([[], true, error]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, , , errors] = result.current;

    expect(errors).toContain(error);
  });

  it('should handle multiple errors', () => {
    const error1 = new Error('Release plans error');
    const error2 = new Error('Releases error');
    useReleasePlansMock.mockReturnValue([[], true, error1]);
    useReleasesMock.mockReturnValue([[], true, error2]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, , , errors] = result.current;

    expect(errors).toHaveLength(2);
    expect(errors).toContain(error1);
    expect(errors).toContain(error2);
  });

  it('should use latest release when multiple releases exist', () => {
    const olderRelease = {
      ...mockReleasesData[0],
      status: {
        ...mockReleasesData[0].status,
        startTime: '2022-11-09T17:30:00Z',
        conditions: [
          {
            lastTransitionTime: '2022-11-09T17:30:00Z',
            message: '',
            reason: 'Failed',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    };
    const newerRelease = {
      ...mockReleasesData[1],
      status: {
        ...mockReleasesData[1].status,
        startTime: '2022-11-09T17:40:00Z',
      },
    };
    useReleasesMock.mockReturnValue([[olderRelease, newerRelease], true, undefined]);

    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes[0].data.status).toBe(runStatus.Succeeded);
  });

  it('should return group with expanded children when expanded is true', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], true),
    );
    const [nodes, group] = result.current;

    expect(group.children).toEqual([nodes[0].id]);
    expect(group.group).toBe(true);
  });

  it('should return group without children when expanded is false', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, group] = result.current;

    expect(group.children).toBeUndefined();
  });

  it('should pass previousTasks to nodes', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', ['task-1', 'task-2'], false),
    );
    const [, group] = result.current;

    expect(group.runAfterTasks).toEqual(['task-1', 'task-2']);
  });

  it('should filter releases by release plan name', () => {
    const unrelatedRelease = {
      ...mockReleasesData[0],
      spec: {
        ...mockReleasesData[0].spec,
        releasePlan: 'different-plan',
      },
    };
    useReleasesMock.mockReturnValue([[...mockReleasesData, unrelatedRelease], true, undefined]);

    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes).toHaveLength(1);
    expect(nodes[0].label).toBe('sre-production');
  });

  it('should use notFoundPrevTask when no releases for specific plan', () => {
    useReleasesMock.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', ['no-release-sre-production'], false),
    );
    const [nodes] = result.current;

    expect(nodes[0].runAfterTasks).toEqual(['no-release-sre-production']);
  });

  it('should return undefined group when not loaded', () => {
    useReleasePlansMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, group] = result.current;

    expect(group).toBeUndefined();
  });

  it('should return undefined group when there are errors', () => {
    const error = new Error('Test error');
    useReleasePlansMock.mockReturnValue([[], true, error]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, group] = result.current;

    expect(group).toBeUndefined();
  });

  it('should handle parallel node width updates', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes).toHaveLength(1);
    expect(nodes[0].width).toBeDefined();
  });

  it('should calculate worst workflow status for group', () => {
    const failedRelease = {
      ...mockReleasesData[0],
      status: {
        ...mockReleasesData[0].status,
        conditions: [
          {
            lastTransitionTime: '2022-11-09T17:33:49Z',
            message: 'Failed',
            reason: 'ReleasePipelineFailed',
            status: 'False',
            type: 'Succeeded',
          },
        ],
      },
    };
    useReleasesMock.mockReturnValue([[failedRelease], true, undefined]);

    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, group] = result.current;

    expect(group.data.status).toBe(runStatus.Failed);
  });

  it('should sort releases by startTime correctly', () => {
    const release1 = {
      ...mockReleasesData[0],
      status: {
        ...mockReleasesData[0].status,
        startTime: '2022-11-09T17:35:00Z',
      },
    };
    const release2 = {
      ...mockReleasesData[1],
      status: {
        ...mockReleasesData[1].status,
        startTime: '2022-11-09T17:36:38Z',
      },
    };
    useReleasesMock.mockReturnValue([[release1, release2], true, undefined]);

    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes).toHaveLength(1);
    expect(nodes[0].data.status).toBeDefined();
  });

  it('should use notFoundPrevTask with default value', () => {
    useReleasesMock.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [nodes] = result.current;

    expect(nodes[0].runAfterTasks).toEqual(['no-releases']);
  });

  it('should return consistent results on re-render with same inputs', () => {
    const { result, rerender } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [firstNodes, firstGroup] = result.current;

    rerender();
    const [secondNodes, secondGroup] = result.current;

    expect(firstNodes).toEqual(secondNodes);
    expect(firstGroup).toEqual(secondGroup);
  });

  it('should return children as undefined when not expanded', () => {
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], false),
    );
    const [, group] = result.current;

    expect(group.children).toBeUndefined();
  });

  it('should return empty child nodes array when no release plans', () => {
    useReleasePlansMock.mockReturnValue([[], true, undefined]);
    const { result } = renderHook(() =>
      useAppReleasePlanNodes('test-ns', 'test-application', [], true),
    );
    const [, group] = result.current;

    expect(group.data.children).toBeUndefined();
  });
});
