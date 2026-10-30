import type { CellContext } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { ComponentGroupKind } from '~/types';
import { componentGroupsTableColumns } from '../component-groups-table-config';

describe('componentGroupsTableColumns', () => {
  describe('Build status column', () => {
    const buildStatusColumn = componentGroupsTableColumns.find((col) => col.id === 'build-status');

    const createMockGroup = (
      globalCandidateList?: Array<{ name: string; lastPromotedImage?: string }>,
    ): ComponentGroupKind => ({
      apiVersion: 'appstudio.redhat.com/v1beta2',
      kind: 'ComponentGroup',
      metadata: {
        name: 'test-group',
        namespace: 'test-ns',
      },
      spec: {
        components: [],
      },
      status: globalCandidateList ? { globalCandidateList } : undefined,
    });

    const createMockInfo = (group: ComponentGroupKind): CellContext<ComponentGroupKind, unknown> =>
      ({
        row: {
          original: group,
        },
        getValue: () => null,
        renderValue: () => null,
        column: { id: 'build-status' },
      }) as CellContext<ComponentGroupKind, unknown>;

    it('should show "-" when globalCandidateList is empty', () => {
      const group = createMockGroup([]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      expect(screen.getByTestId('component-group-no-builds')).toHaveTextContent('-');
    });

    it('should show "-" when globalCandidateList is missing', () => {
      const group = createMockGroup(undefined);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      expect(screen.getByTestId('component-group-no-builds')).toHaveTextContent('-');
    });

    it('should show "-" when status is missing', () => {
      const group: ComponentGroupKind = {
        apiVersion: 'appstudio.redhat.com/v1beta2',
        kind: 'ComponentGroup',
        metadata: {
          name: 'test-group',
          namespace: 'test-ns',
        },
        spec: {
          components: [],
        },
      };
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      expect(screen.getByTestId('component-group-no-builds')).toHaveTextContent('-');
    });

    it('should show green label when all components are promoted', () => {
      const group = createMockGroup([
        { name: 'comp1', lastPromotedImage: 'image1' },
        { name: 'comp2', lastPromotedImage: 'image2' },
        { name: 'comp3', lastPromotedImage: 'image3' },
      ]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('3/3 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      expect(label).toHaveClass('pf-m-green');
    });

    it('should show grey label when no components are promoted', () => {
      const group = createMockGroup([{ name: 'comp1' }, { name: 'comp2' }, { name: 'comp3' }]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('0/3 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      // PatternFly v6 doesn't add a color modifier for grey labels
      expect(label).not.toHaveClass('pf-m-green');
      expect(label).not.toHaveClass('pf-m-orange');
    });

    it('should show orange label when some components are promoted', () => {
      const group = createMockGroup([
        { name: 'comp1', lastPromotedImage: 'image1' },
        { name: 'comp2' },
        { name: 'comp3', lastPromotedImage: 'image3' },
      ]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('2/3 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      expect(label).toHaveClass('pf-m-orange');
    });

    it('should show orange label for 1 out of many promoted', () => {
      const group = createMockGroup([
        { name: 'comp1', lastPromotedImage: 'image1' },
        { name: 'comp2' },
        { name: 'comp3' },
        { name: 'comp4' },
        { name: 'comp5' },
      ]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('1/5 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      expect(label).toHaveClass('pf-m-orange');
    });

    it('should show green label for single promoted component', () => {
      const group = createMockGroup([{ name: 'comp1', lastPromotedImage: 'image1' }]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('1/1 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      expect(label).toHaveClass('pf-m-green');
    });

    it('should show grey label for single non-promoted component', () => {
      const group = createMockGroup([{ name: 'comp1' }]);
      const info = createMockInfo(group);

      const result = buildStatusColumn?.cell?.(info);
      render(<>{result}</>);

      const label = screen.getByTestId('component-group-build-status');
      expect(label).toHaveTextContent('0/1 promoted');
      expect(label).toHaveClass('pf-v6-c-label');
      // PatternFly v6 doesn't add a color modifier for grey labels
      expect(label).not.toHaveClass('pf-m-green');
      expect(label).not.toHaveClass('pf-m-orange');
    });
  });
});
