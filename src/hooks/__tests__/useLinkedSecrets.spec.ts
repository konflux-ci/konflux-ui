import { renderHook } from '@testing-library/react';
import { mockedSecrets, mockedServiceAccount } from '../__data__/mock-data';
import { useLinkedSecrets } from '../useLinkedSecrets';
import { useSecrets } from '../useSecrets';
import { useServiceAccount } from '../useServiceAccount';

jest.mock('../useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('../useServiceAccount', () => ({
  useServiceAccount: jest.fn(() => [mockedServiceAccount, true]),
}));

const useSecretsMock = useSecrets as jest.Mock;
const useServiceAccountMock = useServiceAccount as jest.Mock;

describe('useLinkedSecrets', () => {
  beforeEach(() => {
    useSecretsMock.mockReturnValue([mockedSecrets, true, undefined]);
    useServiceAccountMock.mockReturnValue([mockedServiceAccount, true]);
  });

  it('should fetch secrets with metadataOnly', () => {
    renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));

    expect(useSecretsMock).toHaveBeenCalledWith('rh-ee-rgalvao-tenant', true, {
      metadataOnly: true,
    });
  });

  it('should return filtered linked secrets', () => {
    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));

    const [secrets, loaded] = result.current;

    expect(loaded).toBe(true);
    expect(secrets.map((tr) => tr.metadata?.name)).toEqual([
      'build-pipeline-c7814-dockercfg-bksxm',
    ]);
  });

  it('should return an empty array when secrets are loading', () => {
    useSecretsMock.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
  });

  it('should return an empty array when useServiceAccount is loading', () => {
    useServiceAccountMock.mockReturnValue([null, false]);

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
  });

  it('should return an error if secrets API returns error', () => {
    useSecretsMock.mockReturnValue([[], true, new Error('An API error happened')]);

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toStrictEqual(new Error('An API error happened'));
  });

  it('should return an error if service account API returns error', () => {
    useServiceAccountMock.mockReturnValue([
      null,
      true,
      new Error('An API error happened when fetching service account'),
    ]);

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toStrictEqual(
      new Error('An API error happened when fetching service account'),
    );
  });
});
