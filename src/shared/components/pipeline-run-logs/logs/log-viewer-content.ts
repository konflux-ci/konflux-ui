import type { LogSection, NormalizedLogSection } from '~/shared/components/virtualized-log-viewer/types';

export function formatSectionsForSearch(sections: readonly LogSection[]): string {
  return sections.map((s) => `${s.containerName}\n${s.data}`).join('\n\n');
}

/**
 * Builds the flat search-lines array from already-normalized sections.
 * Each section contributes: [HEADER, ...contentLines], with a single blank
 * line separating adjacent sections (matching the original \n\n join).
 */
export function prepareLogViewerContent(sections: readonly NormalizedLogSection[]): string[] {
  if (sections.length === 0) return [];
  return sections.flatMap((s, i) => {
    const block = [s.containerName, ...s.lines];
    return i < sections.length - 1 ? [...block, ''] : block;
  });
}
