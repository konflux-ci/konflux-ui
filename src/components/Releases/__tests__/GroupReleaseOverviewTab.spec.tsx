import { screen } from '@testing-library/react';
import { mockReleases } from '~/components/Releases/__data__/mock-release-data';
import GroupReleaseOverviewTab from '~/components/Releases/GroupReleaseOverviewTab';
import { useRelease } from '~/hooks/useReleases';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';

jest.mock('~/hooks/useReleases', () => ({ useRelease: jest.fn() }));

describe('GroupReleaseOverviewTab', () => {
  createUseParamsMock({ groupName: 'my-group', releaseName: 'test-release' });
  mockUseNamespaceHook('test-ns');

  it('links the component and snapshot using the component group context', () => {
    jest.mocked(useRelease).mockReturnValue([mockReleases[0], true, undefined, undefined, false]);
    renderWithQueryClientAndRouter(<GroupReleaseOverviewTab />);
    expect(screen.getByRole('link', { name: 'test-component' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/test-component',
    );
    expect(screen.getByRole('link', { name: 'test-snapshot' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups/my-group/snapshots/test-snapshot',
    );
  });

  it('shows loading and missing resource states', () => {
    jest.mocked(useRelease).mockReturnValue([undefined, false, undefined, undefined, false]);
    const view = renderWithQueryClientAndRouter(<GroupReleaseOverviewTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    jest.mocked(useRelease).mockReturnValue([undefined, true, { code: 404 }, undefined, true]);
    view.rerender(<GroupReleaseOverviewTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });
});
