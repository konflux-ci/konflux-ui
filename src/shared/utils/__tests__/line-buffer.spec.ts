import { LineBuffer } from '../line-buffer';

describe('LineBuffer', () => {
  describe('append', () => {
    it('should split text into lines on newline boundaries', () => {
      const buf = new LineBuffer();
      buf.append('line1\nline2\nline3\n');
      expect(buf.getLines()).toEqual(['line1', 'line2', 'line3']);
    });

    it('should include trailing content without a final newline', () => {
      const buf = new LineBuffer();
      buf.append('line1\nline2');
      expect(buf.getLines()).toEqual(['line1', 'line2']);
    });

    it('should accumulate across multiple append calls', () => {
      const buf = new LineBuffer();
      buf.append('first\n');
      buf.append('second\n');
      expect(buf.getLines()).toEqual(['first', 'second']);
    });

    it('should join partial lines across append calls', () => {
      const buf = new LineBuffer();
      buf.append('hel');
      buf.append('lo\nworld\n');
      expect(buf.getLines()).toEqual(['hello', 'world']);
    });

    it('should strip ANSI escape codes', () => {
      const buf = new LineBuffer();
      buf.append('\x1b[31mred text\x1b[0m\n');
      expect(buf.getLines()).toEqual(['red text']);
    });

    it('should handle empty string', () => {
      const buf = new LineBuffer();
      buf.append('');
      expect(buf.getLines()).toEqual([]);
    });

    it('should handle text with only newlines', () => {
      const buf = new LineBuffer();
      buf.append('\n\n');
      expect(buf.getLines()).toEqual(['', '']);
    });

    it('should report correct length', () => {
      const buf = new LineBuffer();
      buf.append('a\nb\nc\n');
      expect(buf.length()).toBe(3);
    });

    it('should be O(message) not O(total) for large buffers', () => {
      const buf = new LineBuffer();
      const bigChunk = `${'x'.repeat(1000)}\n`;
      for (let i = 0; i < 50000; i++) {
        buf.append(bigChunk);
      }
      const start = performance.now();
      buf.append('one more line\n');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(10);
      expect(buf.length()).toBe(50001);
    });
  });

  describe('getLines', () => {
    it('should return empty array for fresh buffer', () => {
      const buf = new LineBuffer();
      expect(buf.getLines()).toEqual([]);
    });

    it('should include incomplete trailing line', () => {
      const buf = new LineBuffer();
      buf.append('complete\nincomplete');
      const lines = buf.getLines();
      expect(lines).toEqual(['complete', 'incomplete']);
    });

    it('should not include trailing line when it is empty', () => {
      const buf = new LineBuffer();
      buf.append('line1\nline2\n');
      expect(buf.getLines()).toEqual(['line1', 'line2']);
    });
  });

  describe('clear', () => {
    it('should reset buffer and tail', () => {
      const buf = new LineBuffer();
      buf.append('some\ndata');
      buf.clear();
      expect(buf.getLines()).toEqual([]);
      expect(buf.length()).toBe(0);
    });
  });
});
