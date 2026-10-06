import { screen } from '@testing-library/react';
import { ComponentLink } from '~/shared/components/component-link/ComponentLink';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

it('links a component without a version', () => {
  renderWithQueryClientAndRouter(<ComponentLink namespace="test-ns" name="my-component" />);
  expect(screen.getByRole('link', { name: 'my-component' })).toHaveAttribute(
    'href',
    '/ns/test-ns/components/my-component',
  );
});
it('includes the version and branch icon in the component details link', () => {
  renderWithQueryClientAndRouter(
    <ComponentLink namespace="test-ns" name="my-component" version="main" />,
  );
  const link = screen.getByRole('link', { name: 'my-component( main)' });
  expect(link).toHaveAttribute('href', '/ns/test-ns/components/my-component');
  expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
