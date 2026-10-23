/**
 * Finds the index just past the closing bracket or brace that matches the
 * opening delimiter at `startIndex`.
 */
export const findJsonEnd = (
  text: string,
  startIndex: number,
  open: string,
  close: string,
): number => {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < text.length; i++) {
    const character = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (character === '\\' && inString) {
      escape = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (character === open) depth++;
    if (character === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
};

/**
 * Extracts valid top-level JSON objects and arrays embedded in arbitrary text.
 * Malformed fragments are skipped while scanning continues after their closing
 * delimiter.
 */
export const extractJsonValues = (text: string): unknown[] => {
  const results: unknown[] = [];
  let offset = 0;

  while (offset < text.length) {
    const arrayIndex = text.indexOf('[', offset);
    const objectIndex = text.indexOf('{', offset);

    if (arrayIndex === -1 && objectIndex === -1) break;

    const startsWithArray = objectIndex === -1 || (arrayIndex !== -1 && arrayIndex < objectIndex);
    const startIndex = startsWithArray ? arrayIndex : objectIndex;
    const end = findJsonEnd(
      text,
      startIndex,
      startsWithArray ? '[' : '{',
      startsWithArray ? ']' : '}',
    );
    if (end === -1) break;

    try {
      results.push(JSON.parse(text.slice(startIndex, end)));
    } catch {
      // Skip malformed JSON fragments.
    }

    offset = end;
  }

  return results;
};
