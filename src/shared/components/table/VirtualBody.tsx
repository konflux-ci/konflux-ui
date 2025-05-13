import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { K8sResourceCommon } from '../../../types/k8s';
import { TableRow, TableRowProps } from './TableRow';

export type VirtualBodyProps<D = unknown, C = unknown> = {
  customData?: C;
  Row: React.FC<React.PropsWithChildren<RowFunctionArgs>>;
  ExpandedContent?: React.FC<React.PropsWithChildren<RowFunctionArgs<D, C>>>;
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  data: D[];
  columns: unknown[];
  scrollTop: number;
  width: number;
  expand: boolean;
  getRowProps?: (obj: D) => Partial<Pick<TableRowProps, 'id' | 'className' | 'title'>>;
  onRowsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    startIndex: number;
    stopIndex: number;
  }) => void;
  expandedRowIndex?: number;
};

export type RowFunctionArgs<T = unknown, C = unknown> = {
  obj: T;
  columns: unknown[];
  customData?: C;
};

const RowMemo = React.memo<RowFunctionArgs & { Row: React.FC<RowFunctionArgs> }>(
  ({ Row, ...props }) => <Row {...props} />,
);

export const VirtualBody: React.FC<React.PropsWithChildren<VirtualBodyProps>> = (props) => {
  const {
    customData,
    Row,
    height,
    isScrolling,
    onChildScroll,
    data,
    columns,
    scrollTop,
    width,
    getRowProps,
    onRowsRendered,
    ExpandedContent,
    expandedRowIndex,
  } = props;

  const cellMeasurementCache = React.useMemo(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 44,
      keyMapper: (rowIndex) =>
        (props?.data?.[rowIndex] as K8sResourceCommon)?.metadata?.uid ?? rowIndex,
    });
  }, [props?.data]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = React.useRef<any>(null);
  const prevExpandedIndexRef = React.useRef<number | undefined>(undefined);

  // clears cached row heights and recomputes them when the expanded row changes.
  React.useEffect(() => {
    const prevIndex = prevExpandedIndexRef.current;

    if (prevIndex !== undefined) {
      cellMeasurementCache.clear(prevIndex);
    }

    if (expandedRowIndex !== undefined) {
      cellMeasurementCache.clear(expandedRowIndex);
    }

    listRef.current?.recomputeRowHeights();

    prevExpandedIndexRef.current = expandedRowIndex;
  }, [cellMeasurementCache, expandedRowIndex]);

  const rowRenderer = React.useCallback(
    ({ index, isVisible, key, style, parent }) => {
      const rowArgs = {
        obj: data[index],
        columns,
        customData,
      };

      // do not render non visible elements (this excludes overscan)
      if (!isVisible) {
        return null;
      }

      const rowProps = getRowProps?.(rowArgs.obj);
      const rowId = rowProps?.id ?? key;
      const isExpanded = expandedRowIndex === index;

      return (
        <>
          <CellMeasurer
            cache={cellMeasurementCache}
            columnIndex={0}
            key={key}
            parent={parent}
            rowIndex={index}
          >
            <div style={style}>
              <TableRow {...rowProps} id={rowId} index={index} trKey={key} style={{}}>
                <RowMemo Row={Row} {...rowArgs} />
              </TableRow>
              {ExpandedContent && isExpanded && (
                <div key={`expanded-${key}`}>
                  <ExpandedContent {...rowArgs} />
                </div>
              )}
            </div>
          </CellMeasurer>
        </>
      );
    },
    [
      ExpandedContent,
      Row,
      cellMeasurementCache,
      columns,
      customData,
      data,
      expandedRowIndex,
      getRowProps,
    ],
  );

  return (
    <VirtualTableBody
      ref={listRef}
      autoHeight
      className="pf-v5-c-table pf-m-compact pf-m-border-rows pf-v5-c-window-scroller"
      deferredMeasurementCache={cellMeasurementCache}
      rowHeight={cellMeasurementCache.rowHeight}
      height={height || 0}
      isScrolling={isScrolling}
      onScroll={onChildScroll}
      overscanRowCount={10}
      columns={columns}
      rows={data}
      rowCount={data.length}
      rowRenderer={rowRenderer}
      scrollTop={scrollTop}
      width={width}
      onRowsRendered={onRowsRendered}
    />
  );
};
