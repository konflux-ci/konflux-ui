import { useNavigate } from 'react-router-dom';
import { renderHook } from '@testing-library/react-hooks';
import { ReleasePlanKind } from '../../../../types/coreBuildService';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { runStatus } from '../../../../utils/pipeline-utils';
import { useAccessReviewForModel } from '../../../../utils/rbac';
import { useReleasePlanActions } from '../releaseplan-actions';

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

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

describe('useReleasePlanActions', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should contain trigger actions', () => {
    const { result } = renderHook(() =>
      useReleasePlanActions({
        metadata: { name: 'test-release-plan' },
        spec: { application: 'test-app' },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as ReleasePlanKind),
    );
    const actions = result.current;

    expect(actions[0]).toEqual(
      expect.objectContaining({
        label: 'Trigger release plan',
        cta: {
          href: `/ns/test-ns/release/release-plan/trigger?releasePlan=test-release-plan`,
        },
      }),
    );
  });

  it('should contain Edit actions', () => {
    const { result } = renderHook(() =>
      useReleasePlanActions({
        metadata: { name: 'test-release-plan' },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as ReleasePlanKind),
    );
    const actions = result.current;

    expect(actions[1]).toEqual(
      expect.objectContaining({
        label: 'Edit release plan',
        cta: {
          href: `/ns/test-ns/release/release-plan/edit/test-release-plan`,
        },
      }),
    );
  });

  it('should contain Delete actions', () => {
    const { result } = renderHook(() =>
      useReleasePlanActions({
        metadata: { name: 'test-release-plan' },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as ReleasePlanKind),
    );
    const actions = result.current;

    expect(actions[2].label).toEqual('Delete release plan');
    expect(actions[2].id).toEqual('releaseplan-delete');
  });

  it('should contain disabled actions', () => {
    useAccessReviewForModelMock.mockReturnValue([false, false]);
    const { result } = renderHook(() =>
      useReleasePlanActions({
        metadata: { name: 'test-release-plan' },
        status: { conditions: [{ type: 'Succeeded', status: runStatus.Running }] },
      } as ReleasePlanKind),
    );
    const actions = result.current;
    expect(actions[0].label).toEqual('Trigger release plan');
    expect(actions[0].disabled).toEqual(true);
    expect(actions[0].disabledTooltip).toEqual(
      "You don't have permission to trigger this release plan",
    );
    expect(actions[1].label).toEqual('Edit release plan');
    expect(actions[1].disabled).toEqual(true);
    expect(actions[1].disabledTooltip).toEqual(
      "You don't have permission to edit this release plan",
    );
    expect(actions[2].label).toEqual('Delete release plan');
    expect(actions[2].disabled).toEqual(true);
    expect(actions[2].disabledTooltip).toEqual(
      "You don't have permission to delete this release plan",
    );
  });
});
