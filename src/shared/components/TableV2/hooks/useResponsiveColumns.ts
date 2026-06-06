import { useState, useEffect, useMemo } from 'react';
import { type ColumnDefinition, type Breakpoint } from '../types';

/**
 * Breakpoint pixel values matching PatternFly's responsive grid.
 * Each value is the `min-width` at which the breakpoint becomes active.
 */
const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1450,
};

/**
 * Tracks viewport breakpoints and returns a column visibility map based on
 * each column's `visibleFrom` setting.
 *
 * Uses `window.matchMedia` to listen for breakpoint changes. Only registers
 * listeners for breakpoints actually used by the provided columns, avoiding
 * unnecessary subscriptions.
 *
 * @typeParam TData - The row data type
 * @param columns - Column definitions to derive responsive visibility from
 * @returns An object with `columnVisibility` — a `Record<string, boolean>` where
 *   keys are column IDs and values indicate whether the column should be visible
 *   at the current viewport width. Columns without `visibleFrom` are omitted
 *   (treated as always visible).
 *
 * @example
 * ```tsx
 * const { columnVisibility } = useResponsiveColumns(columns);
 * // columnVisibility: { status: true, details: false }
 * ```
 */
export const useResponsiveColumns = <TData>(
  columns: ColumnDefinition<TData>[],
): { columnVisibility: Record<string, boolean> } => {
  const usedBreakpoints = useMemo(() => {
    const bps = new Set<Breakpoint>();
    for (const col of columns) {
      if (col.visibleFrom) {
        bps.add(col.visibleFrom);
      }
    }
    return bps;
  }, [columns]);

  const [breakpointMatches, setBreakpointMatches] = useState<Record<Breakpoint, boolean>>(() => {
    const initial: Partial<Record<Breakpoint, boolean>> = {};
    for (const bp of usedBreakpoints) {
      const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[bp]}px)`);
      initial[bp] = mql.matches;
    }
    return initial as Record<Breakpoint, boolean>;
  });

  useEffect(() => {
    const mediaQueryLists: { bp: Breakpoint; mql: MediaQueryList }[] = [];

    for (const bp of usedBreakpoints) {
      const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[bp]}px)`);
      mediaQueryLists.push({ bp, mql });
    }

    const handlers = mediaQueryLists.map(({ bp, mql }) => {
      const handler = (e: MediaQueryListEvent) => {
        setBreakpointMatches((prev) => ({ ...prev, [bp]: e.matches }));
      };
      mql.addEventListener('change', handler);
      return { mql, handler };
    });

    return () => {
      for (const { mql, handler } of handlers) {
        mql.removeEventListener('change', handler);
      }
    };
  }, [usedBreakpoints]);

  const columnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    for (const col of columns) {
      if (col.visibleFrom) {
        visibility[col.id] = breakpointMatches[col.visibleFrom] ?? false;
      }
    }
    return visibility;
  }, [columns, breakpointMatches]);

  return { columnVisibility };
};
