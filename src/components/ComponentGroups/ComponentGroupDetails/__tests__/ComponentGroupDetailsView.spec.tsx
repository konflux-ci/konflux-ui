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

it('offers the pipeline runs tab alongside existing component group tabs', async () => {
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
  renderWithQueryClientAndRouter(<ComponentGroupDetailsView />);
  await user.click(screen.getByRole('tab', { name: 'Pipeline runs' }));
  expect(window.location.pathname).toBe('/ns/test-ns/groups/test-group/pipelineruns');
  expect(screen.getByRole('tab', { name: 'Integration tests' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Releases' })).toBeInTheDocument();
});
