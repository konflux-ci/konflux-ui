import { screen } from '@testing-library/react';
import ComponentDetailsTab from '~/components/ComponentsPage/ComponentDetails/ComponentDetailsTab';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { ComponentKind } from '~/types';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';

jest.mock('~/hooks/useComponentsV2', () => ({ useComponentV2: jest.fn() }));

const component = {
  apiVersion: 'konflux-ci.dev/v1alpha1',
  kind: 'Component',
  metadata: { name: 'frontend', namespace: 'test-ns' },
  spec: {
    source: { url: 'https://github.com/example/frontend' },
    containerImage: 'quay.io/example/frontend',
  },
} as ComponentKind;

describe('new-model ComponentDetailsTab', () => {
  mockUseNamespaceHook('test-ns');
  createUseParamsMock({ componentName: 'frontend' });

  beforeEach(() => {
    jest.mocked(useComponentV2).mockReturnValue([component, true, undefined]);
  });

  it('shows the new resource details without legacy application edit controls', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByRole('link', { name: 'example/frontend' })).toHaveAttribute(
      'href',
      'https://github.com/example/frontend',
    );
    expect(screen.getByText('quay.io/example/frontend')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit build pipeline plan' }),
    ).not.toBeInTheDocument();
    expect(useComponentV2).toHaveBeenCalledWith('test-ns', 'frontend', true);
  });

  it('shows loading while fetching the new resource', () => {
    jest.mocked(useComponentV2).mockReturnValue([null, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an API error', () => {
    jest.mocked(useComponentV2).mockReturnValue([null, true, { code: 403 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });
});
