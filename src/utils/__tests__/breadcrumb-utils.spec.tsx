import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react-hooks';
import { useApplicationBreadcrumbs } from '../breadcrumb-utils';
import { createUseParamsMock } from '../test-utils';

const useParamsMock = createUseParamsMock();

describe('useApplicationBreadcrumbs', () => {
  it('should contain till not return application name link if the application name is not passed', () => {
    useParamsMock.mockReturnValue({});
    const { result } = renderHook(() => useApplicationBreadcrumbs());
    expect(result.current).toHaveLength(4);
  });

  it('should contain application name link when application name is passed', () => {
    useParamsMock.mockReturnValue({ applicationName: 'test-app' });
    const { result } = renderHook(() => useApplicationBreadcrumbs());
    expect(result.current).toHaveLength(6);
  });
});
