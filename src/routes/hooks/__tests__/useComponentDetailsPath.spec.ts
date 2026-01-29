import { renderHook } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '../../../feature-flags/hooks';
import { useNamespace } from '../../../shared/providers/Namespace';
import { COMPONENT_DETAILS_PATH, COMPONENT_DETAILS_V2_PATH } from '../../paths';
import useComponentDetailsPath from '../useComponentDetailsPath';

jest.mock('../../../feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('../../../shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

const useIsOnFeatureFlagMock = useIsOnFeatureFlag as jest.Mock;
const useNamespaceMock = useNamespace as jest.Mock;

describe('useComponentDetailsPath', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should return v2 component details path when feature flag is on', () => {
    useIsOnFeatureFlagMock.mockReturnValue(true);
    const { result } = renderHook(() => useComponentDetailsPath());

    expect(result.current.getComponentDetailsPath('test-app', 'my-component')).toBe(
      COMPONENT_DETAILS_V2_PATH.createPath({
        workspaceName: 'test-ns',
        componentName: 'my-component',
      }),
    );
  });

  it('should return v1 component details path when feature flag is off', () => {
    useIsOnFeatureFlagMock.mockReturnValue(false);
    const { result } = renderHook(() => useComponentDetailsPath());

    expect(result.current.getComponentDetailsPath('test-app', 'my-component')).toBe(
      COMPONENT_DETAILS_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-app',
        componentName: 'my-component',
      }),
    );
  });

  it('should switch paths when the flag changes', () => {
    useIsOnFeatureFlagMock.mockReturnValue(false);
    const { result, rerender } = renderHook(() => useComponentDetailsPath());

    expect(result.current.getComponentDetailsPath('test-app', 'my-component')).toBe(
      COMPONENT_DETAILS_PATH.createPath({
        workspaceName: 'test-ns',
        applicationName: 'test-app',
        componentName: 'my-component',
      }),
    );

    useIsOnFeatureFlagMock.mockReturnValue(true);
    rerender();

    expect(result.current.getComponentDetailsPath('test-app', 'my-component')).toBe(
      COMPONENT_DETAILS_V2_PATH.createPath({
        workspaceName: 'test-ns',
        componentName: 'my-component',
      }),
    );
  });
});
