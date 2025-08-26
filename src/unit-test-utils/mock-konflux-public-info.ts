import type { KonfluxPublicInfo } from '~/types/konflux-public-info';
import * as KonfluxPublicInfoHook from '../hooks/useKonfluxPublicInfo';
import { createJestMockFunction } from './common';
import type { JestMockedFunction } from './type';

export const mockUseKonfluxPublicInfo = (
  value: Partial<KonfluxPublicInfo> = {},
  loaded = true,
  error: unknown = null,
): JestMockedFunction<typeof KonfluxPublicInfoHook.useKonfluxPublicInfo> => {
  const resolved: KonfluxPublicInfo = { rbac: [], ...value } as KonfluxPublicInfo;
  const mockFn = createJestMockFunction<
    typeof KonfluxPublicInfoHook.useKonfluxPublicInfo
  >().mockReturnValue([resolved, loaded, error]);
  jest.spyOn(KonfluxPublicInfoHook, 'useKonfluxPublicInfo').mockImplementation(mockFn);
  return mockFn;
};

export const mockUseKonfluxPublicInfoImplementation = (
  implementation?: (
    ...args: Parameters<typeof KonfluxPublicInfoHook.useKonfluxPublicInfo>
  ) => ReturnType<typeof KonfluxPublicInfoHook.useKonfluxPublicInfo>,
): JestMockedFunction<typeof KonfluxPublicInfoHook.useKonfluxPublicInfo> => {
  const mockFn =
    createJestMockFunction<typeof KonfluxPublicInfoHook.useKonfluxPublicInfo>(implementation);
  jest.spyOn(KonfluxPublicInfoHook, 'useKonfluxPublicInfo').mockImplementation(mockFn);
  return mockFn;
};
