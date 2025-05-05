import { SortByDirection } from '@patternfly/react-table';
import { ComponentProps } from '~/shared/components/table/Table';
import { ColumnConfig, createTableHeaders } from '../utils';

describe('List Utils', () => {
  describe('createTableHeaders', () => {
    const onSortMock = jest.fn();

    const tableComponentPropsMock: ComponentProps = {
      data: [],
      unfilteredData: [],
      filters: [],
      selected: false,
      match: undefined,
      kindObj: undefined,
    };

    const genericColumnsConfig: ColumnConfig[] = [
      { title: 'Name', className: 'class-name', sortable: true },
      { title: 'Created', className: 'class-created', sortable: true },
      { title: 'Status', className: 'class-status' },
    ];

    it('should return a function that returns properly structured headers', () => {
      const getHeaders = createTableHeaders(genericColumnsConfig);
      const headers = getHeaders(0, SortByDirection.asc, onSortMock)(tableComponentPropsMock);

      expect(headers).toHaveLength(3);
      expect(headers[0].title).toBe('Name');
      expect(headers[0].props.className).toBe('class-name');
      expect(headers[0].props.sort).toBeDefined();

      expect(headers[2].title).toBe('Status');
      expect(headers[2].props.className).toBe('class-status');
      expect(headers[2].props.sort).toBeUndefined();
    });

    it('should include correct sort params for sortable columns', () => {
      const activeIndex = 1;
      const direction = SortByDirection.desc;
      const getHeaders = createTableHeaders(genericColumnsConfig);
      const headers = getHeaders(activeIndex, direction, onSortMock)(tableComponentPropsMock);

      expect(headers[1].props.sort).toEqual({
        columnIndex: 1,
        sortBy: { index: activeIndex, direction },
        onSort: onSortMock,
      });
    });

    it('should not include sort params for non-sortable columns', () => {
      const getHeaders = createTableHeaders(genericColumnsConfig);
      const headers = getHeaders(0, SortByDirection.asc, onSortMock)(tableComponentPropsMock);

      expect(headers[2].props.sort).toBeUndefined();
    });
  });
});
