import { renderHook } from '@testing-library/react';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { mockedServiceAccount } from '../__data__/mock-data';
import { useServiceAccount } from '../useServiceAccount';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useServiceAccount', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([mockedServiceAccount, true, undefined]);
  });

  it('should return service account from provided serviceAccountName', () => {
    const { result } = renderHook(() =>
      useServiceAccount('rh-ee-rgalvao-tenant', 'build-pipeline-c7814'),
    );

    const [serviceAccount, loaded] = result.current;

    expect(loaded).toBe(true);
    expect(serviceAccount.metadata.name).toBe('build-pipeline-c7814');
  });

  it('should return null when service account API is loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() =>
      useServiceAccount('rh-ee-rgalvao-tenant', 'build-pipeline-c7814'),
    );
    expect(result.current[0]).toEqual(null);
    expect(result.current[1]).toBe(false);
  });

  it('should return an error if service account API returns error', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('An API error happened'),
    });

    const { result } = renderHook(() =>
      useServiceAccount('rh-ee-rgalvao-tenant', 'build-pipeline-c78147814'),
    );
    expect(result.current[0]).toEqual(null);
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toStrictEqual(Error('An API error happened'));
  });
});
