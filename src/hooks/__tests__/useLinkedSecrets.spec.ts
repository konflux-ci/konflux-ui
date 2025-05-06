import { renderHook } from '@testing-library/react';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { mockedSecrets, mockedServiceAccount } from '../__data__/mock-data';
import { useLinkedSecrets } from '../useLinkedSecrets';
import { useServiceAccount } from '../useServiceAccount';

jest.mock('../useServiceAccount', () => ({
  useServiceAccount: jest.fn(() => [mockedServiceAccount, true]),
}));
const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useServiceAccountMock = useServiceAccount as jest.Mock;

describe('useLinkedSecrets', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([mockedSecrets, true, undefined]);
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
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

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
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('An API error happened'),
    });

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toStrictEqual(Error('An API error happened'));
  });

  it('should return an error if service account API returns error', () => {
    useServiceAccountMock.mockReturnValue([
      null,
      false,
      new Error('An API error happened when fetching service account'),
    ]);

    const { result } = renderHook(() => useLinkedSecrets('rh-ee-rgalvao-tenant', 'c7814'));
    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toStrictEqual(
      Error('An API error happened when fetching service account'),
    );
  });
});
