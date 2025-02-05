import * as React from 'react';
import { RouteMatch } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { TableGridBreakpoint, OnSelect, ThProps } from '@patternfly/react-table';
import { StatusBox } from '../status-box/StatusBox';
import TableComponent from './TableComponent';
import { RowFunctionArgs, VirtualBodyProps } from './VirtualBody';

import './Table.scss';

export type Filter = { key: string; value: string };

export type ComponentProps<D = unknown> = {
  data: D[];
  unfilteredData: D[];
  filters: Filter[];
  selected: boolean;
  match: RouteMatch<string>;
  kindObj: unknown;
};

export type InfiniteLoaderProps = {
  rowCount?: number | undefined;
  loadMoreRows: (params: { startIndex: number; stopIndex: number }) => Promise<unknown> | void;
  isRowLoaded: (params: { index: number }) => boolean;
};

export type HeaderFunc = (componentProps: ComponentProps) => { title: string; props: ThProps }[];

export type TableProps<D = unknown, C = unknown> = Partial<ComponentProps<D>> & {
  customData?: C;
  Header: HeaderFunc;
  loadError?: string | object;
  Row?: React.FC<React.PropsWithChildren<RowFunctionArgs<D, C>>>;
  'aria-label': string;
  onSelect?: OnSelect;
  NoDataEmptyMsg?: React.ComponentType<React.PropsWithChildren<object>>;
  EmptyMsg?: React.ComponentType<React.PropsWithChildren<object>>;
  Toolbar?: React.ReactNode;
  loaded?: boolean;
  reduxID?: string;
  reduxIDs?: string[];
  label?: string;
  columnManagementID?: string;
  isPinned?: (val: D) => boolean;
  staticFilters?: Filter[];
  activeColumns?: Set<string>;
  gridBreakPoint?: TableGridBreakpoint;
  selectedResourcesForKind?: string[];
  expand?: boolean;
  getRowProps?: VirtualBodyProps<D>['getRowProps'];
  virtualize?: boolean;
  onRowsRendered?: VirtualBodyProps<D>['onRowsRendered'];
  isInfiniteLoading?: boolean;
  infiniteLoaderProps?: InfiniteLoaderProps;
};

const Table: React.FC<React.PropsWithChildren<TableProps>> = ({
  data,
  unfilteredData,
  loaded,
  loadError,
  label,
  NoDataEmptyMsg,
  EmptyMsg,
  Toolbar,
  ...rest
}) => (
  <StatusBox
    skeleton={
      <Bullseye data-test="data-table-skeleton">
        <Spinner />
      </Bullseye>
    }
    data={data}
    loaded={loaded}
    loadError={loadError}
    unfilteredData={unfilteredData}
    label={label}
    NoDataEmptyMsg={NoDataEmptyMsg}
    EmptyMsg={EmptyMsg}
    Toolbar={Toolbar}
  >
    <TableComponent data={data} {...rest} />
  </StatusBox>
);

export default Table;
