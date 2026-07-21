import truncate from 'lodash/truncate';

export const LINE_PATTERN = /^.*(\n|$)/gm;
const TRUNCATE_LENGTH = 1024;
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g;

export class LineBuffer {
  private _buffer: string[];
  private _tail: string;
  private _hasTruncated: boolean;

  constructor() {
    this._buffer = [];
    this._tail = '';
    this._hasTruncated = false;
  }

  ingest(text): number {
    const lines = text.match(LINE_PATTERN);
    let lineCount = 0;
    lines.forEach((line) => {
      const next = `${this._tail}${line}`;
      if (next.length > TRUNCATE_LENGTH) {
        this._hasTruncated = true;
      }
      if (/\n$/.test(line as string)) {
        this._buffer.push(truncate(next, { length: TRUNCATE_LENGTH }).trimEnd());
        lineCount++;
        this._tail = '';
      } else {
        this._tail = next;
      }
    });
    return lineCount;
  }

  clear(): void {
    this._buffer = [];
    this._hasTruncated = false;
    this._tail = '';
  }

  getLines(): string[] {
    if (this._tail) {
      this._buffer.push(this._tail);
      this._tail = '';
    }
    return this._buffer;
  }

  getBlob(options: BlobPropertyBag, lineSeparator = '\n'): Blob {
    return new Blob([this._buffer.join(lineSeparator)], options);
  }

  getHasTruncated(): boolean {
    return this._hasTruncated;
  }

  getTail() {
    return truncate(this._tail, { length: TRUNCATE_LENGTH });
  }

  length(): number {
    return this._buffer.length;
  }

  append(text: string): void {
    const stripped = text.replace(ANSI_ESCAPE_REGEX, '');
    const lines = stripped.match(LINE_PATTERN);
    if (!lines) return;

    for (const line of lines) {
      const next = this._tail + line;
      if (/\n$/.test(line)) {
        this._buffer.push(next.trimEnd());
        this._tail = '';
      } else {
        this._tail = next;
      }
    }
  }
}
