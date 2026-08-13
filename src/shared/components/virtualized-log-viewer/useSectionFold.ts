import React from 'react';
import type { LogSection } from './types';

const EMPTY_EXPANDED_SECTIONS = new Set<number>();
const EMPTY_OVERRIDES: ReadonlyMap<number, boolean> = new Map();

/** Default: in-progress open, completed folded. */
const isExpandedByDefault = (section: LogSection): boolean => !section.isCompleted;

const resolveIsExpanded = (
  sections: readonly LogSection[],
  overrides: ReadonlyMap<number, boolean>,
  index: number,
): boolean => {
  const override = overrides.get(index);
  return override !== undefined ? override : isExpandedByDefault(sections[index]);
};

/** Stable identity key so log-content updates don't reset overrides. */
const sectionNamesKey = (sections: readonly LogSection[]): string =>
  sections.map((s) => s.containerName).join('\0');

const isPrefixGrowth = (prev: readonly string[], next: readonly string[]): boolean =>
  next.length >= prev.length && prev.every((name, i) => name === next[i]);

/** Store only deviations from the default expand policy. */
const withOverride = (
  prev: ReadonlyMap<number, boolean>,
  index: number,
  expanded: boolean,
  defaultExpanded: boolean,
): ReadonlyMap<number, boolean> => {
  if (expanded === defaultExpanded) {
    if (!prev.has(index)) return prev;
    const next = new Map(prev);
    next.delete(index);
    return next.size > 0 ? next : EMPTY_OVERRIDES;
  }
  if (prev.get(index) === expanded) return prev;
  const next = new Map(prev);
  next.set(index, expanded);
  return next;
};

export const useSectionFold = (sections: readonly LogSection[]) => {
  const sectionsRef = React.useRef(sections);
  sectionsRef.current = sections;

  const [overrides, setOverrides] = React.useState<ReadonlyMap<number, boolean>>(EMPTY_OVERRIDES);

  const namesKey = sectionNamesKey(sections);
  const prevNamesRef = React.useRef<string[]>(sections.map((s) => s.containerName));

  React.useEffect(() => {
    const prevNames = prevNamesRef.current;
    const nextNames = namesKey === '' ? [] : namesKey.split('\0');

    // Task switch: drop overrides. Progressive step append: keep them.
    if (!isPrefixGrowth(prevNames, nextNames) && !isPrefixGrowth(nextNames, prevNames)) {
      setOverrides(EMPTY_OVERRIDES);
    } else if (nextNames.length < prevNames.length) {
      setOverrides((prev) => {
        if (prev.size === 0) return prev;
        let changed = false;
        const pruned = new Map<number, boolean>();
        prev.forEach((value, index) => {
          if (index < nextNames.length) pruned.set(index, value);
          else changed = true;
        });
        if (!changed) return prev;
        return pruned.size > 0 ? pruned : EMPTY_OVERRIDES;
      });
    }

    prevNamesRef.current = nextNames;
  }, [namesKey]);

  const expandedSections = React.useMemo(() => {
    if (sections.length === 0) return EMPTY_EXPANDED_SECTIONS;

    const expanded = new Set<number>();
    for (let i = 0; i < sections.length; i++) {
      if (resolveIsExpanded(sections, overrides, i)) expanded.add(i);
    }
    return expanded;
  }, [sections, overrides]);

  const toggleSection = React.useCallback((sectionIndex: number) => {
    const currentSections = sectionsRef.current;
    if (sectionIndex < 0 || sectionIndex >= currentSections.length) return;

    setOverrides((prev) => {
      const defaultExpanded = isExpandedByDefault(currentSections[sectionIndex]);
      const nextExpanded = !resolveIsExpanded(currentSections, prev, sectionIndex);
      return withOverride(prev, sectionIndex, nextExpanded, defaultExpanded);
    });
  }, []);

  const expandSection = React.useCallback((sectionIndex: number) => {
    const currentSections = sectionsRef.current;
    if (sectionIndex < 0 || sectionIndex >= currentSections.length) return;

    setOverrides((prev) => {
      if (resolveIsExpanded(currentSections, prev, sectionIndex)) return prev;
      return withOverride(
        prev,
        sectionIndex,
        true,
        isExpandedByDefault(currentSections[sectionIndex]),
      );
    });
  }, []);

  return React.useMemo(
    () => ({ expandedSections, toggleSection, expandSection }),
    [expandedSections, toggleSection, expandSection],
  );
};
