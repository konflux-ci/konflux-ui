import { screen } from '@testing-library/react';
import { COMPONENT_DETAILS_V2_PATH } from '~/routes/paths';
import type { ComponentKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import ComponentsListRow from '../ComponentListRow';

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/components/Components/component-actions', () => ({
  useComponentActions: () => [],
}));

const useNamespaceMock = jest.requireMock('~/shared/providers/Namespace/useNamespaceInfo')
  .useNamespace as jest.Mock;

const createMockComponent = (overrides: Partial<ComponentKind> = {}): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: { name: 'test-component', namespace: 'test-ns', uid: 'uid-1' },
    spec: {
      application: 'test-app',
      componentName: 'test-component',
      source: { git: { url: 'https://github.com/org/repo', revision: 'main' } },
    },
    ...overrides,
  }) as ComponentKind;

const renderRow = (component: ComponentKind) => {
  const obj = { ...component };
  return renderWithQueryClientAndRouter(
    <table>
      <tbody>
        <tr>
          <ComponentsListRow obj={obj} columns={[]} />
        </tr>
      </tbody>
    </table>,
  );
};

describe('ComponentListRow', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('renders component name as link', () => {
    renderRow(createMockComponent());
    expect(screen.getByRole('link', { name: 'test-component' })).toBeInTheDocument();
  });

  it('links to component details page with correct path', () => {
    renderRow(
      createMockComponent({ metadata: { name: 'my-comp', namespace: 'test-ns', uid: '1' } }),
    );
    useNamespaceMock.mockReturnValue('test-ns');
    const expectedPath = COMPONENT_DETAILS_V2_PATH.createPath({
      workspaceName: 'test-ns',
      componentName: 'my-comp',
    });
    expect(screen.getByRole('link', { name: 'my-comp' })).toHaveAttribute('href', expectedPath);
  });

  it('renders component versions count', () => {
    renderRow(
      createMockComponent({
        spec: {
          application: 'test-app',
          componentName: 'test-component',
          source: {
            git: { url: 'https://github.com/org/repo', revision: 'main' },
            versions: [
              { name: 'v1', revision: 'main' },
              { name: 'v2', revision: 'branch' },
            ],
          },
        },
      } as ComponentKind),
    );
    expect(screen.getByTestId('component-versions-count')).toHaveTextContent('2');
  });

  it('renders versions count 0 when source.versions is undefined', () => {
    renderRow(createMockComponent());
    expect(screen.getByTestId('component-versions-count')).toHaveTextContent('0');
  });

  it('renders GitRepoLink when spec.source.git is present', () => {
    renderRow(
      createMockComponent({
        spec: {
          application: 'test-app',
          componentName: 'test-component',
          source: {
            git: {
              url: 'https://github.com/org/repo',
              revision: 'main',
              context: './src',
            },
          },
        },
      } as ComponentKind),
    );
    const link = screen.getByRole('link', { name: /org\/repo/i });
    expect(link).toBeInTheDocument();
  });

  it('does not render GitRepoLink when spec.source.git is absent', () => {
    renderRow(
      createMockComponent({
        spec: {
          application: 'test-app',
          componentName: 'test-component',
          source: {},
        },
      } as ComponentKind),
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'test-component' })).toBeInTheDocument();
  });

  it('renders row with data-test component-list-item', () => {
    renderRow(createMockComponent());
    expect(screen.getByTestId('component-list-item')).toBeInTheDocument();
  });
});
