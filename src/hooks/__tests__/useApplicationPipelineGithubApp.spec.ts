import { renderHook } from '@testing-library/react';
import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';
import { mockUseKonfluxPublicInfo } from '~/unit-test-utils';
import { useApplicationPipelineGitHubApp } from '../useApplicationPipelineGitHubApp';

const useKonfluxPublicInfoMock = mockUseKonfluxPublicInfo();

describe('useApplicationPipelineGithubApp', () => {
  it('should return correct github app', () => {
    // staging
    useKonfluxPublicInfoMock.mockReturnValue([
      { environment: KonfluxInstanceEnvironments.STAGING, rbac: [] },
      true,
      null,
    ]);
    let hook = renderHook(() => useApplicationPipelineGitHubApp());
    expect(hook.result.current).toEqual({
      url: 'https://github.com/apps/konflux-staging',
      name: 'konflux-staging',
    });

    // production
    useKonfluxPublicInfoMock.mockReturnValue([
      { environment: KonfluxInstanceEnvironments.PRODUCTION, rbac: [] },
      true,
      null,
    ]);
    hook = renderHook(() => useApplicationPipelineGitHubApp());
    expect(hook.result.current).toEqual({
      url: 'https://github.com/apps/red-hat-konflux',
      name: 'red-hat-konflux',
    });

    // default (dev)
    useKonfluxPublicInfoMock.mockReturnValue([{ environment: undefined, rbac: [] }, true, null]);
    hook = renderHook(() => useApplicationPipelineGitHubApp());
    expect(hook.result.current).toEqual({
      url: 'https://github.com/apps/red-hat-konflux',
      name: 'red-hat-konflux',
    });
  });
});
