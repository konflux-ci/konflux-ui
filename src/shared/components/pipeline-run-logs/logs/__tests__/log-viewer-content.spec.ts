import { singleLogSection } from '~/shared/components/virtualized-log-viewer/log-viewer-utils';
import { formatSectionsForSearch, prepareLogViewerContent } from '../log-viewer-content';

describe('log-viewer-content', () => {
  describe('formatSectionsForSearch', () => {
    it('should join sections with uppercase headers', () => {
      const result = formatSectionsForSearch([
        { containerName: 'step-a', data: 'line 1' },
        { containerName: 'step-b', data: 'line 2' },
      ]);
      expect(result).toBe('STEP-A\nline 1\n\nSTEP-B\nline 2');
    });
  });

  describe('prepareLogViewerContent', () => {
    it('should return empty content for no sections', () => {
      expect(prepareLogViewerContent([])).toEqual({
        processedData: '',
        downloadData: '',
      });
    });

    it('should include step header in processed and download data for a single section', () => {
      const result = prepareLogViewerContent([singleLogSection('hello\nworld', 'task')]);
      expect(result.processedData).toBe('TASK\nhello\nworld');
      expect(result.downloadData).toBe('TASK\nhello\nworld');
    });

    it('should strip ANSI and normalize line endings for single-section content', () => {
      const result = prepareLogViewerContent([
        singleLogSection('line\r\n\x1b[31mred\x1b[0m', 'step'),
      ]);
      expect(result.processedData).toBe('STEP\nline\nred');
    });

    it('should include step headers for multiple sections', () => {
      const sections = [
        { containerName: 'a', data: 'one' },
        { containerName: 'b', data: 'two' },
      ] as const;
      const result = prepareLogViewerContent(sections);
      expect(result.downloadData).toBe('A\none\n\nB\ntwo');
      expect(result.processedData).toBe('A\none\n\nB\ntwo');
    });

    it('should return empty download data when all sections have no log content', () => {
      const result = prepareLogViewerContent([{ containerName: 'task', data: '' }]);
      expect(result.downloadData).toBe('');
    });
  });
});
