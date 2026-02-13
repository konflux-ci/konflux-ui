import { useNavigate } from 'react-router-dom';
import { renderHook } from '@testing-library/react-hooks';
import { mockSnapshot } from '~/__data__/mock-snapshots';
import { ResourceSource } from '~/types/k8s';
import { RELEASEPLAN_TRIGGER_PATH } from '../../../routes/paths';
import { Snapshot } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useNamespace } from '../../providers/Namespace';
import useTriggerReleaseAction from '../useTriggerReleaseAction';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('../../providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

const useNavigateMock = useNavigate as jest.Mock;
const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useNamespaceMock = useNamespace as jest.Mock;

describe('useTriggerReleaseAction', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useNamespaceMock.mockReturnValue('test-ns');
    useAccessReviewForModelMock.mockReturnValue([true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns enabled action when access is allowed and no snapshot is provided', () => {
    const { result } = renderHook(() => useTriggerReleaseAction());

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: false,
        disabledTooltip: null,
        key: 'trigger-release',
        label: 'Trigger release',
      }),
    );
  });

  it('returns enabled action when access is allowed and snapshot is not archived', () => {
    const { result } = renderHook(() =>
      useTriggerReleaseAction(mockSnapshot, ResourceSource.Cluster),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: false,
        disabledTooltip: null,
        key: 'trigger-release',
        label: 'Trigger release',
      }),
    );
  });

  it('returns disabled action when access is denied and no snapshot is provided', () => {
    useAccessReviewForModelMock.mockReturnValue([false]);

    const { result } = renderHook(() => useTriggerReleaseAction());

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: "You don't have access to trigger releases",
      }),
    );
  });

  it('returns disabled action when access is denied and snapshot is not archived', () => {
    useAccessReviewForModelMock.mockReturnValue([false]);

    const { result } = renderHook(() =>
      useTriggerReleaseAction(mockSnapshot, ResourceSource.Cluster),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: "You don't have access to trigger releases",
      }),
    );
  });

  it('returns disabled action when access is allowed and snapshot is archived', () => {
    useAccessReviewForModelMock.mockReturnValue([true]);

    const { result } = renderHook(() =>
      useTriggerReleaseAction(mockSnapshot, ResourceSource.Archive),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot trigger release from archived snapshot',
      }),
    );
  });

  it('returns disabled action when access is denied and snapshot is archived', () => {
    useAccessReviewForModelMock.mockReturnValue([false]);

    const { result } = renderHook(() =>
      useTriggerReleaseAction(mockSnapshot, ResourceSource.Archive),
    );

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: "You don't have access to trigger releases",
      }),
    );
  });

  it('returns disabled action when access is allowed and snapshot is provided but source is undefined', () => {
    const { result } = renderHook(() => useTriggerReleaseAction(mockSnapshot, undefined));

    expect(result.current).toEqual(
      expect.objectContaining({
        isDisabled: true,
        disabledTooltip: 'Cannot trigger release from archived snapshot',
      }),
    );
  });

  it('navigates to trigger path without snapshot', () => {
    const { result } = renderHook(() => useTriggerReleaseAction());

    result.current.cta();

    expect(navigateMock).toHaveBeenCalledWith(
      RELEASEPLAN_TRIGGER_PATH.createPath({ workspaceName: 'test-ns' }),
    );
  });

  it('adds snapshot query param when snapshot is provided', () => {
    const snapshot = { metadata: { name: 'snapshot-1' } } as Snapshot;
    const { result } = renderHook(() => useTriggerReleaseAction(snapshot));

    result.current.cta();

    expect(navigateMock).toHaveBeenCalledWith(
      `${RELEASEPLAN_TRIGGER_PATH.createPath({ workspaceName: 'test-ns' })}?snapshot=snapshot-1`,
    );
  });
});
