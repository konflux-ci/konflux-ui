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
  expandedRowIndexes?: Set<number>;
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
    expandedRowIndexes,
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
  const prevExpandedRowIndexes = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    const prev = prevExpandedRowIndexes.current;
    const next = expandedRowIndexes ?? new Set();

    const collapsed = [...prev].filter((idx) => !next.has(idx));
    const expanded = [...next];

    // Clear both collapsed and newly expanded rows
    [...collapsed, ...expanded].forEach((index) => {
      cellMeasurementCache.clear(index);
    });

    [...collapsed, ...expanded].forEach((index) => {
      listRef.current?.recomputeRowHeights(index);
    });

    // Update ref for next comparison
    prevExpandedRowIndexes.current = new Set(next);

    // ⚠️ DO NOT include `cellMeasurementCache` in the deps array.
    // It's a stable instance from `useMemo` and only meant to be recreated when `data` changes.
    // Including it would re-run this effect unnecessarily when the cache is regenerated,
    // causing visible glitches like jumping or incorrect row positions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRowIndexes]);

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
      const isExpanded = expandedRowIndexes?.has(index as number);

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
                  <ExpandedContent key={`expanded-content-${key}`} {...rowArgs} />
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
      expandedRowIndexes,
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
