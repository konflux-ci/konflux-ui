import React from 'react';

interface UseSmartRowHeightParams {
  lines: string[];
  containerRef: React.RefObject<HTMLDivElement>;
  baseLineHeight: number;
  fastRowHeightEstimationLimit?: number;
}

let canvas: HTMLCanvasElement | undefined;

/**
 * Get the number of characters that fit in a line using Canvas measurement
 * This is more accurate than simple width / char_width calculations
 */
const getCharNumsPerLine = (lineWidth: number, font: string): number => {
  // Reuse canvas for better performance
  canvas = canvas || document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 100; // fallback

  context.font = font;
  const oneChar = context.measureText('a');
  return Math.floor(lineWidth / oneChar.width);
};

/**
 * Strip ANSI escape codes from text
 */
const stripAnsi = (str: string): string => {
  // Simple ANSI escape code removal (PatternFly has more complex logic)
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[[0-9;]*m/g, '');
};

/**
 * Smart row height estimation hook inspired by PatternFly LogViewer
 *
 * Strategy:
 * 1. Use Canvas to accurately calculate chars per line
 * 2. For most lines: estimate height = ceil(text_length / chars_per_line) * line_height
 * 3. For very long lines (> fastRowHeightEstimationLimit): actually measure by rendering
 *
 * This balances performance and accuracy.
 */
export const useSmartRowHeight = ({
  lines,
  containerRef,
  baseLineHeight,
  fastRowHeightEstimationLimit = 5000,
}: UseSmartRowHeightParams) => {
  const [charNumsPerLine, setCharNumsPerLine] = React.useState<number>(100);
  const measurementContainerRef = React.useRef<HTMLDivElement | null>(null);
  const isChrome = React.useMemo(() => navigator.userAgent.indexOf('Chrome') !== -1, []);

  // Calculate chars per line when container size or baseLineHeight changes
  React.useEffect(() => {
    if (!containerRef.current || baseLineHeight === 0) return;

    // Create dummy elements to measure styling
    const dummyText = document.createElement('span');
    dummyText.className = 'pf-v5-c-log-viewer__text';
    dummyText.textContent = 'a';

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.appendChild(dummyText);
    document.body.appendChild(tempContainer);

    const styles = getComputedStyle(dummyText);
    const containerWidth = containerRef.current.offsetWidth;

    // Account for line number gutter (approximately 60-80px)
    const gutterWidth = 60;
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;

    const lineWidth = containerWidth - gutterWidth - paddingLeft - paddingRight;

    const font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    const charsPerLine = getCharNumsPerLine(lineWidth, font);

    setCharNumsPerLine(charsPerLine);

    // Cleanup
    document.body.removeChild(tempContainer);
  }, [containerRef, baseLineHeight]);

  /**
   * Compute actual row height by rendering to DOM
   * Only used for very long lines to prevent Chrome bug
   */
  const computeRowHeight = React.useCallback((rowText: string, estimatedHeight: number): number => {
    if (!measurementContainerRef.current) {
      return estimatedHeight;
    }

    const dummyText = document.createElement('span');
    dummyText.className = 'pf-v5-c-log-viewer__text';
    dummyText.textContent = rowText;

    measurementContainerRef.current.appendChild(dummyText);
    const computedHeight = dummyText.clientHeight;
    measurementContainerRef.current.removeChild(dummyText);

    return computedHeight;
  }, []);

  /**
   * Get estimated size for a specific row index
   * This is the function passed to virtualizer's estimateSize
   */
  const getEstimatedRowHeight = React.useCallback(
    (rowIndex: number): number => {
      if (baseLineHeight === 0 || charNumsPerLine === 0) {
        return 20; // fallback
      }

      const rowText = stripAnsi(lines[rowIndex] || '');

      // Calculate number of wrapped lines
      const numRows = Math.ceil(rowText.length / charNumsPerLine);
      const heightGuess = baseLineHeight * (numRows || 1);

      // For very long lines in Chrome, actually measure to prevent overflow bug
      // Related: https://github.com/bvaughn/react-window/issues/593
      if (rowText.length > fastRowHeightEstimationLimit && isChrome) {
        return computeRowHeight(rowText, heightGuess);
      }

      return heightGuess;
    },
    [
      lines,
      baseLineHeight,
      charNumsPerLine,
      fastRowHeightEstimationLimit,
      isChrome,
      computeRowHeight,
    ],
  );

  return {
    getEstimatedRowHeight,
    measurementContainerRef,
    charNumsPerLine,
  };
};
