import { renderHook } from '@testing-library/react-hooks';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { useRegistryLoginUrl } from '../useRegistryLoginUrl';

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(),
}));

const mockUseKonfluxPublicInfo = useKonfluxPublicInfo as jest.Mock;
describe('useRegistryLoginUrl', () => {
  it('should return null when data is loading', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([{}, false, null]);

    const { result } = renderHook(() => useRegistryLoginUrl());

    expect(result.current).toEqual([null, false, null]);
  });

  it('should return null and error when there is an error', () => {
    const error = { code: 500, message: 'Failed to load' };
    mockUseKonfluxPublicInfo.mockReturnValue([{}, true, error]);

    const { result } = renderHook(() => useRegistryLoginUrl());

    expect(result.current).toEqual([null, true, error]);
  });

  it('should return null when imageProxyUrl is not configured', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([{}, true, null]);

    const { result } = renderHook(() => useRegistryLoginUrl());

    expect(result.current).toEqual([null, true, null]);
  });

  it('should return null when publicInfo is null', () => {
    mockUseKonfluxPublicInfo.mockReturnValue([null, true, null]);

    const { result } = renderHook(() => useRegistryLoginUrl());

    expect(result.current).toEqual([null, true, null]);
  });

  it('should return correct URL when imageProxyUrl is configured', () => {
    const mockUrl = 'https://image-rbac-proxy.apps.kflux-ocp-p01.7ayg.p1.openshiftapps.com';
    mockUseKonfluxPublicInfo.mockReturnValue([{ imageProxyUrl: mockUrl }, true, null]);

    const { result } = renderHook(() => useRegistryLoginUrl());
    const expectedUrl = `${mockUrl}/idp`;
    expect(result.current).toEqual([expectedUrl, true, null]);
  });
});
