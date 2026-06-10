import { normalizeSection, singleLogSection } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import { formatSectionsForSearch, prepareLogViewerContent } from '../log-viewer-content';

describe('log-viewer-content', () => {
  describe('formatSectionsForSearch', () => {
    it('should join sections with headers and data', () => {
      const result = formatSectionsForSearch([
        { containerName: 'STEP-A', data: 'line 1' },
        { containerName: 'STEP-B', data: 'line 2' },
      ]);
      expect(result).toBe('STEP-A\nline 1\n\nSTEP-B\nline 2');
    });
  });

  describe('prepareLogViewerContent', () => {
    it('should return empty lines for no sections', () => {
      expect(prepareLogViewerContent([])).toEqual([]);
    });

    it('should include step header for a single section', () => {
      const result = prepareLogViewerContent([normalizeSection(singleLogSection('hello\nworld', 'TASK'))]);
      expect(result).toEqual(['TASK', 'hello', 'world']);
    });

    it('should strip ANSI and normalize line endings', () => {
      const result = prepareLogViewerContent([
        normalizeSection(singleLogSection('line\r\n\x1b[31mred\x1b[0m', 'STEP')),
      ]);
      expect(result).toEqual(['STEP', 'line', 'red']);
    });

    it('should separate multiple sections with a blank line', () => {
      const sections = [
        normalizeSection({ containerName: 'A', data: 'one' }),
        normalizeSection({ containerName: 'B', data: 'two' }),
      ];
      expect(prepareLogViewerContent(sections)).toEqual(['A', 'one', '', 'B', 'two']);
    });
  });
});
