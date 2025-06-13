import { renderHook } from '@testing-library/react';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { componentCRMocks, mockedActions } from '../__data__/mock-data';
import { useComponentActions } from '../component-actions';

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;

const mockedComponent = componentCRMocks[0];

const normalizeCta = (cta) =>
  typeof cta === 'function'
    ? expect.any(Function)
    : expect.objectContaining({ href: expect.any(String) });

const normalizeMockedActions = (disabled = false, includeManagedLinkedSecrets = true) =>
  mockedActions
    .filter((ma) => includeManagedLinkedSecrets || ma.label !== 'Manage linked secrets')
    .map(({ cta, ...rest }) =>
      expect.objectContaining({ ...rest, cta: normalizeCta(cta), disabled }),
    );

describe('component-actions', () => {
  describe('useComponentActions', () => {
    beforeEach(() => {
      useAccessReviewForModelMock.mockReturnValue([true, true]);
    });

    it('should contain all actions', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions()));
    });

    it('actions should be disabled when user does not have access rights', () => {
      useAccessReviewForModelMock.mockReturnValue([false, false]);
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions(true)));
    });

    it('should hide "Manage linked secrets" action if feature flag is disabled', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(expect.arrayContaining(normalizeMockedActions(false, false)));
    });

    it('should return empty array if component is null or undefined', () => {
      const { result } = renderHook(() =>
        useComponentActions(undefined, mockedComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual([]);
    });
  });
});
