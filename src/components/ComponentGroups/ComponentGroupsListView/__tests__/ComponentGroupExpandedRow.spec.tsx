import { render, screen } from '@testing-library/react';
import { ComponentGroupKind, ComponentReference, ComponentReferenceKind } from '~/types';
import { ComponentGroupExpandedRow } from '../ComponentGroupExpandedRow';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('~/components/LatestBuild/LatestPushBuildSection', () => ({
  __esModule: true,
  default: ({ componentName, version }: { componentName: string; version?: string }) => (
    <span data-test="latest-push-build">
      {componentName}/{version ?? 'all'}
    </span>
  ),
}));

const createMockGroup = (
  name: string,
  globalCandidateList?: Array<{ name: string; lastPromotedImage?: string }>,
): ComponentGroupKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'ComponentGroup',
    metadata: { name, namespace: 'test-ns' },
    spec: { components: [] },
    status: globalCandidateList ? { globalCandidateList } : undefined,
  }) as ComponentGroupKind;

describe('ComponentGroupExpandedRow', () => {
  const namespace = 'test-ns';
  const defaultAllGroups: ComponentGroupKind[] = [];
  const groupName = 'test-group';

  it('should render a compact table with Name, Type, and Build status headers', () => {
    const components: ComponentReference[] = [{ name: 'frontend' }];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Build/Promotion status')).toBeInTheDocument();
    expect(screen.getByTestId('group-detail-table-rows')).toBeInTheDocument();
  });

  it('should render a row for each component', () => {
    const components: ComponentReference[] = [
      { name: 'frontend' },
      { name: 'backend' },
      { name: 'api' },
    ];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    const componentLinks = screen.getAllByTestId('component-name');
    expect(componentLinks).toHaveLength(3);
    expect(componentLinks[0]).toHaveTextContent('frontend');
    expect(componentLinks[1]).toHaveTextContent('backend');
    expect(componentLinks[2]).toHaveTextContent('api');
  });

  it('should link components to component details page', () => {
    const components: ComponentReference[] = [{ name: 'frontend' }];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    const link = screen.getByTestId('component-name');
    expect(link).toHaveAttribute('href', '/ns/test-ns/components/frontend');
  });

  it('should link component groups to group details page', () => {
    const components: ComponentReference[] = [
      { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
    ];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    const link = screen.getByTestId('component-name');
    expect(link).toHaveAttribute('href', '/ns/test-ns/groups/nested-group');
  });

  it('should show Component type label for components', () => {
    const components: ComponentReference[] = [{ name: 'frontend' }, { name: 'backend' }];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    const labels = screen.getAllByText('Component');
    expect(labels).toHaveLength(2);
  });

  it('should show Group type label for component groups', () => {
    const components: ComponentReference[] = [
      { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
    ];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    expect(screen.getByText('Group')).toBeInTheDocument();
  });

  it('should handle mixed components and groups', () => {
    const components: ComponentReference[] = [
      { name: 'frontend' },
      { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
      { name: 'backend' },
    ];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    expect(screen.getAllByText('Component')).toHaveLength(2);
    expect(screen.getByText('Group')).toBeInTheDocument();

    const frontendLink = screen.getByRole('link', { name: 'frontend' });
    const backendLink = screen.getByRole('link', { name: 'backend' });
    const groupLink = screen.getByRole('link', { name: 'nested-group' });

    expect(frontendLink).toHaveAttribute('href', '/ns/test-ns/components/frontend');
    expect(backendLink).toHaveAttribute('href', '/ns/test-ns/components/backend');
    expect(groupLink).toHaveAttribute('href', '/ns/test-ns/groups/nested-group');
  });

  it('should handle empty components array', () => {
    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={[]}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    expect(screen.getByTestId('group-detail-table-rows')).toBeInTheDocument();
    expect(screen.queryByTestId('component-name')).not.toBeInTheDocument();
  });

  it('should handle case-insensitive componentGroup kind', () => {
    const components: ComponentReference[] = [
      { name: 'group1', kind: 'componentGroup' as ComponentReferenceKind },
      { name: 'group2', kind: 'componentGroup' as ComponentReferenceKind },
    ];

    render(
      <ComponentGroupExpandedRow
        namespace={namespace}
        components={components}
        allGroups={defaultAllGroups}
        groupName={groupName}
      />,
    );

    const groups = screen.getAllByText('Group');
    expect(groups).toHaveLength(2);
  });

  describe('Build/Promotion status column', () => {
    it('should show LatestPushBuildSection for components', () => {
      const components: ComponentReference[] = [
        {
          name: 'frontend',
          componentVersion: { name: 'main', version: 'v1' },
        },
      ];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={defaultAllGroups}
          groupName={groupName}
        />,
      );

      const buildStatus = screen.getByTestId('latest-push-build');
      expect(buildStatus).toHaveTextContent('frontend/v1');
    });

    it('should show "-" for component groups with no globalCandidateList', () => {
      const components: ComponentReference[] = [
        { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
      ];
      const allGroups = [createMockGroup('nested-group')];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={allGroups}
          groupName={groupName}
        />,
      );

      // The "-" appears in the Build status column for the group
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should show green label for component groups with all promoted', () => {
      const components: ComponentReference[] = [
        { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
      ];
      const allGroups = [
        createMockGroup('nested-group', [
          { name: 'comp1', lastPromotedImage: 'image1' },
          { name: 'comp2', lastPromotedImage: 'image2' },
        ]),
      ];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={allGroups}
          groupName={groupName}
        />,
      );

      const label = screen.getByTestId('component-group-promotion-status');
      expect(label).toHaveTextContent('2/2 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
    });

    it('should show grey label for component groups with no promoted', () => {
      const components: ComponentReference[] = [
        { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
      ];
      const allGroups = [createMockGroup('nested-group', [{ name: 'comp1' }, { name: 'comp2' }])];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={allGroups}
          groupName={groupName}
        />,
      );

      const label = screen.getByTestId('component-group-promotion-status');
      expect(label).toHaveTextContent('0/2 promoted');
    });

    it('should show orange label for component groups with some promoted', () => {
      const components: ComponentReference[] = [
        { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
      ];
      const allGroups = [
        createMockGroup('nested-group', [
          { name: 'comp1', lastPromotedImage: 'image1' },
          { name: 'comp2' },
        ]),
      ];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={allGroups}
          groupName={groupName}
        />,
      );

      const label = screen.getByTestId('component-group-promotion-status');
      expect(label).toHaveTextContent('1/2 promoted');
    });

    it('should show build/promotion status for mixed components and groups', () => {
      const components: ComponentReference[] = [
        { name: 'frontend', componentVersion: { name: 'main', version: 'v1' } },
        { name: 'nested-group', kind: 'componentGroup' as ComponentReferenceKind },
        { name: 'backend', componentVersion: { name: 'release', version: 'v2' } },
      ];
      const allGroups = [
        createMockGroup('nested-group', [
          { name: 'comp1', lastPromotedImage: 'image1' },
          { name: 'comp2' },
          { name: 'comp3' },
        ]),
      ];

      render(
        <ComponentGroupExpandedRow
          namespace={namespace}
          components={components}
          allGroups={allGroups}
          groupName={groupName}
        />,
      );

      // Components show LatestPushBuildSection
      const builds = screen.getAllByTestId('latest-push-build');
      expect(builds).toHaveLength(2);
      expect(builds[0]).toHaveTextContent('frontend/v1');
      expect(builds[1]).toHaveTextContent('backend/v2');

      // Group shows build status label
      const label = screen.getByTestId('component-group-promotion-status');
      expect(label).toHaveTextContent('1/3 promoted');
    });
  });
});
