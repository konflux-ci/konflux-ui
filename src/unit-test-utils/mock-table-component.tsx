import * as React from 'react';
import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import type { ComponentProps, HeaderFunc, InfiniteLoaderProps } from '~/shared/components/table/Table';
import type { RowFunctionArgs } from '~/shared/components/table/VirtualBody';

export const TABLE_COMPONENT_MODULE = '~/shared/components/table/TableComponent';

type MockColumn = ReturnType<HeaderFunc>[number];

export type TableComponentMockProps = Partial<ComponentProps> & {
  Header: HeaderFunc;
  Row?: React.FC<RowFunctionArgs>;
  getRowProps?: (row: unknown) => { id?: string };
  onRowsRendered?: (params: { stopIndex: number }) => void;
  infiniteLoaderProps?: InfiniteLoaderProps;
};

export type RowPropsFactory = (
  row: unknown,
  index: number,
  tableProps: TableComponentMockProps,
) => Record<string, unknown>;

export type CreateTableComponentMockOptions = {
  /** When true, renders rows with props.Row instead of RowComponent */
  usePropsRow?: boolean;
  /** Whether to render the Header columns in thead */
  includeHeader?: boolean;
  /** Extra props merged into each row component */
  rowProps?: Record<string, unknown> | RowPropsFactory;
  /** Invoked in useEffect when data changes */
  onDataChange?: (props: TableComponentMockProps) => void;
};

export const infiniteLoaderOnDataChange = (props: TableComponentMockProps) => {
  const { data = [] } = props;
  props.onRowsRendered?.({ stopIndex: data.length - 1 });
  void props.infiniteLoaderProps?.loadMoreRows?.({ startIndex: 0, stopIndex: data.length });
  props.infiniteLoaderProps?.isRowLoaded?.({ index: 0 });
  props.infiniteLoaderProps?.isRowLoaded?.({ index: data.length });
};

export const onRowsRenderedOnDataChange = (props: TableComponentMockProps) => {
  const { data = [] } = props;
  props.onRowsRendered?.({ stopIndex: Math.max(data.length - 1, 0) });
};

export const propsRowInfiniteLoaderTableComponentMockOptions: CreateTableComponentMockOptions = {
  usePropsRow: true,
  onDataChange: infiniteLoaderOnDataChange,
};

export const propsRowOnRowsRenderedTableComponentMockOptions: CreateTableComponentMockOptions = {
  usePropsRow: true,
  onDataChange: onRowsRenderedOnDataChange,
};

const getMockTableComponentModule = (): typeof import('./mock-table-component') =>
  jest.requireActual('~/unit-test-utils/mock-table-component');

/**
 * Returns a TableComponent mock. Use inside jest.mock factory callbacks via requireTableComponentMock.
 */
export const createTableComponentMock = (
  RowComponent?: React.ComponentType<Record<string, unknown>>,
  options: CreateTableComponentMockOptions = {},
) => {
  const { usePropsRow = false, includeHeader = true, rowProps, onDataChange } = options;

  const MockTableComponent = (props: TableComponentMockProps) => {
    const { data = [], filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns: MockColumn[] = props.Header?.(cProps as ComponentProps<unknown>) ?? [];
    const Row = props.Row;
    const propsRef = React.useRef(props);
    propsRef.current = props;

    React.useEffect(() => {
      onDataChange?.(propsRef.current);
    }, [data]);

    return (
      <Table role="table" aria-label="table" variant="compact" borders={true}>
        {includeHeader && (
          <Thead>
            <Tr>
              {columns.map((col, idx) => (
                <Th key={idx} {...(col.props ?? {})}>
                  {col.title}
                </Th>
              ))}
            </Tr>
          </Thead>
        )}
        <Tbody>
          {data.map((d, i) => {
            const extraRowProps =
              typeof rowProps === 'function' ? rowProps(d, i, props) : (rowProps ?? {});

            const rowElement =
              usePropsRow && Row ? (
                <Row obj={d} index={i} columns={columns} />
              ) : RowComponent ? (
                <RowComponent obj={d} index={i} columns={columns} {...extraRowProps} />
              ) : null;

            return <Tr key={props.getRowProps?.(d)?.id ?? i}>{rowElement}</Tr>;
          })}
        </Tbody>
      </Table>
    );
  };

  return MockTableComponent;
};

/** For use inside jest.mock factory callbacks only. */
export const requireTableComponentMock = (
  RowComponent?: React.ComponentType<Record<string, unknown>>,
  options?: CreateTableComponentMockOptions,
) => getMockTableComponentModule().createTableComponentMock(RowComponent, options);

const isTableRowComponent = (
  value: unknown,
): value is React.ComponentType<Record<string, unknown>> => typeof value === 'function';

/** For use inside jest.mock factory callbacks only. */
export const requireTableComponentMockWithRowModule = (
  rowModulePath: string,
  options?: CreateTableComponentMockOptions,
  rowExportName?: string,
) => {
  const rowModule: Record<string, unknown> = jest.requireActual(rowModulePath);
  const rowExport = rowExportName ? rowModule[rowExportName] : rowModule.default;

  if (!isTableRowComponent(rowExport)) {
    throw new Error(`Row component not found in ${rowModulePath}`);
  }

  return requireTableComponentMock(rowExport, options);
};

/** For use inside jest.mock factory callbacks only. */
export const requirePropsRowInfiniteLoaderTableComponentMock = () =>
  requireTableComponentMock(undefined, propsRowInfiniteLoaderTableComponentMockOptions);

/** For use inside jest.mock factory callbacks only. */
export const requirePropsRowOnRowsRenderedTableComponentMock = () =>
  requireTableComponentMock(undefined, propsRowOnRowsRenderedTableComponentMockOptions);
