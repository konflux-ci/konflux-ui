import { normalizeLogLines } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import type { LogSection } from '~/shared/components/virtualized-log-viewer/types';

export function formatSectionsForSearch(sections: readonly LogSection[]): string {
  return sections.map((s) => `${s.containerName.toUpperCase()}\n${s.data}`).join('\n\n');
}

export interface PreparedLogViewerContent {
  processedData: string;
  downloadData: string;
}

export function prepareLogViewerContent(
  sections: readonly LogSection[],
): PreparedLogViewerContent {
  if (sections.length === 0) {
    return { processedData: '', downloadData: '' };
  }

  if (sections.length === 1) {
    const { containerName, data } = sections[0];
    return {
      processedData: normalizeLogLines(`${containerName.toUpperCase()}\n${data}`).join('\n'),
      downloadData: data,
    };
  }

  const downloadData = formatSectionsForSearch(sections);
  return {
    processedData: normalizeLogLines(downloadData).join('\n'),
    downloadData,
  };
}
