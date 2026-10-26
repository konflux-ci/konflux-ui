import { extractJsonValues, findJsonEnd } from '../json-utils';

describe('findJsonEnd', () => {
  it.each([
    ['object', 'prefix {"nested":{"value":1}} suffix', 7, '{', '}', 29],
    ['array', 'prefix [[1], [2, 3]] suffix', 7, '[', ']', 20],
  ])('finds the end of a nested %s', (_label, text, startIndex, open, close, expected) => {
    expect(findJsonEnd(text, startIndex, open, close)).toBe(expected);
  });

  it('ignores delimiters and escaped quotes inside strings', () => {
    const text = String.raw`{"message":"escaped \" quote and } brace","value":1} trailing`;

    expect(findJsonEnd(text, 0, '{', '}')).toBe(52);
  });

  it('returns -1 when the closing delimiter is missing', () => {
    expect(findJsonEnd('{"nested":{"value":1}', 0, '{', '}')).toBe(-1);
  });
});

describe('extractJsonValues', () => {
  it('extracts nested objects and arrays while ignoring delimiters inside strings', () => {
    const log =
      'scan started\n{"summary":"Fix } in [config]","nested":{"items":[1,2]}}\n[{"name":"openssl"}]\n';

    expect(extractJsonValues(log)).toEqual([
      { summary: 'Fix } in [config]', nested: { items: [1, 2] } },
      [{ name: 'openssl' }],
    ]);
  });

  it('extracts empty and adjacent JSON values', () => {
    expect(extractJsonValues('{}[] {"value":null}')).toEqual([{}, [], { value: null }]);
  });

  it('ignores text and JSON primitive values', () => {
    expect(extractJsonValues('scan started\ntrue 42 "text"\nscan finished')).toEqual([]);
  });

  it('skips a malformed fragment and continues with the next JSON value', () => {
    expect(extractJsonValues('{invalid json}\n[{"valid":true}]')).toEqual([[{ valid: true }]]);
  });

  it('returns values parsed before an unterminated fragment', () => {
    expect(extractJsonValues('{"valid":true}\n{"unterminated":')).toEqual([{ valid: true }]);
  });

  it('returns an empty array for an unterminated fragment', () => {
    expect(extractJsonValues('prefix [1, 2')).toEqual([]);
  });

  it('handles escaped quotes and backslashes inside strings', () => {
    const log = String.raw`{"path":"C:\\tmp\\file","message":"say \"hello\""}`;

    expect(extractJsonValues(log)).toEqual([
      { path: String.raw`C:\tmp\file`, message: 'say "hello"' },
    ]);
  });
});
