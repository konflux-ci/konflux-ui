import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { Button } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { K8sResourceCommon } from '../../../types/k8s';
import { TableData } from './TableData';
import { TableRow, TableRowProps } from './TableRow';
import './Table.scss';

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
};

export type RowFunctionArgs<T = unknown, C = unknown> = {
  obj: T;
  columns: unknown[];
  customData?: C;
  index?: number;
};

const RowMemo = React.memo<
  RowFunctionArgs & {
    Row: React.FC<RowFunctionArgs>;
    expand: boolean;
    isExpanded: boolean;
    onToggle: (index: number) => void;
    index: number;
  }
>(({ Row, expand, isExpanded, onToggle, index, ...props }) => {
  if (expand) {
    return (
      <>
        <TableData data-test="virtual-body-expand-row">
          <Button variant="plain" onClick={() => onToggle?.(index)}>
            {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
          </Button>
        </TableData>
        <Row {...props} index={index} />
      </>
    );
  }
  return <Row {...props} index={index} />;
});

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
    expand,
  } = props;

  const cellMeasurementCache = React.useMemo(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 44,
      keyMapper: (rowIndex) =>
        (props?.data?.[rowIndex] as K8sResourceCommon)?.metadata?.uid ?? rowIndex,
    });
  }, [props?.data]);

  const [expandedRowIndexes, setExpandedRowIndexes] = React.useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRowIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = React.useRef<any>(null);
  const prevExpandedRowIndexes = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    const prev = prevExpandedRowIndexes.current;
    const next = expandedRowIndexes ?? new Set();

    // determine what's changed
    const collapsed = [...prev].filter((idx) => !next.has(idx));
    const expanded = [...next].filter((idx) => !prev.has(idx));
    const changedIndexes = [...collapsed, ...expanded];

    changedIndexes.forEach((index) => {
      cellMeasurementCache.clear(index);
      listRef.current?.recomputeRowHeights(index);
    });

    // update ref for next comparison
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

      const reComputeRowHeights = () => {
        cellMeasurementCache.clear(index);
        listRef.current?.recomputeRowHeights(index);
      };

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
              <TableRow
                {...rowProps}
                recompute={reComputeRowHeights}
                id={rowId}
                index={index}
                trKey={key}
              >
                <RowMemo
                  Row={Row}
                  {...rowArgs}
                  expand={expand}
                  index={index}
                  onToggle={toggleRow}
                  isExpanded={isExpanded}
                />
              </TableRow>
              {ExpandedContent && isExpanded && (
                <div key={`expanded-${key}`}>
                  <ExpandedContent key={`expanded-content-${key}`} {...rowArgs} index={index} />
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
      expand,
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
