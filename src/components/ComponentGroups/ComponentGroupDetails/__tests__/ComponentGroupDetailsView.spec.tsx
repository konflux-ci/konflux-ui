import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentGroupDetailsView from '~/components/ComponentGroups/ComponentGroupDetails/ComponentGroupDetailsView';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';

jest.mock('~/hooks/useComponentGroups', () => ({ useComponentGroup: jest.fn() }));
createUseParamsMock({ groupName: 'test-group' });
mockUseNamespaceHook('test-ns');

it('shows Pipeline runs first and navigates there from Integration tests', async () => {
  const user = userEvent.setup();
  jest.mocked(useComponentGroup).mockReturnValue([
    {
      apiVersion: 'appstudio.redhat.com/v1beta2',
      kind: 'ComponentGroup',
      metadata: { name: 'test-group' },
      spec: { components: [] },
    },
    true,
    undefined,
  ]);
  window.history.replaceState({}, '', '/ns/test-ns/groups/test-group/integrationtests');
  renderWithQueryClientAndRouter(<ComponentGroupDetailsView />);
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent.trim())).toEqual([
    'Pipeline runs',
    'Integration tests',
    'Releases',
  ]);
  await user.click(screen.getByRole('tab', { name: 'Pipeline runs' }));
  expect(window.location.pathname).toBe('/ns/test-ns/groups/test-group/pipelineruns');
  expect(screen.getByRole('tab', { name: 'Integration tests' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Releases' })).toBeInTheDocument();
});
