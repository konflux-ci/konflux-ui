import { useState, useEffect, useMemo } from 'react';
import { type ColumnDefinition, type Breakpoint } from '../types';

const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1450,
};

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
