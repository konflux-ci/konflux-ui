import {
  normalizeSection,
  singleLogSection,
} from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import { prepareLogViewerContent } from '../log-viewer-content';

describe('log-viewer-content', () => {
  describe('prepareLogViewerContent', () => {
    it('should return empty lines for no sections', () => {
      expect(prepareLogViewerContent([])).toEqual([]);
    });

    it('should include step header for a single section', () => {
      const result = prepareLogViewerContent([
        normalizeSection(singleLogSection('hello\nworld', 'TASK')),
      ]);
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
