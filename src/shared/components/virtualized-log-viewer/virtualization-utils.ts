/**
 * Configuration constants for virtualization behavior
 */
export const VIRTUALIZATION_CONFIG = {
  // Fallback values when measurement or DOM access fails
  FALLBACK_CHAR_WIDTH: 8, // Typical for monospace fonts (~8px)
  FALLBACK_CHARS_PER_LINE: 70, // Assumes ~600px container width
  FALLBACK_LINE_HEIGHT: 20, // Default single line height

  // Height estimation safety margins
  SAFETY_MARGIN_DEFAULT: 1.4, // 40% margin for logs ≤ 10k lines
  SAFETY_MARGIN_LARGE: 3.0, // 200% margin for logs > 10k lines (handles heavy wrapping)
  LARGE_LOG_THRESHOLD: 10000, // Threshold for large log detection

  // Overscan (buffer) configuration by log size
  TINY_LOG_LENGTH: 100, // Threshold for tiny logs (render all)
  DEFAULT_OVERSCAN: 50, // Default buffer for non-tiny logs
} as Record<string, number>;

// Cache canvas instance to avoid repetitive DOM pressure and memory overhead
let sharedCanvas: HTMLCanvasElement | null = null;

/**
 * Calculate appropriate overscan count based on log size.
 * Larger overscan provides better scroll accuracy and prevents flickering.
 */
export function getOverscanCount(lineCount: number): number {
  const safeLineCount = Math.max(0, lineCount);
  if (safeLineCount < VIRTUALIZATION_CONFIG.TINY_LOG_LENGTH) {
    return safeLineCount;
  }
  return VIRTUALIZATION_CONFIG.DEFAULT_OVERSCAN;
}

/**
 * Get safety margin multiplier based on log size.
 * Larger logs require more margin due to accumulated estimation errors from wrapping.
 */
export function getSafetyMargin(lineCount: number): number {
  return lineCount > VIRTUALIZATION_CONFIG.LARGE_LOG_THRESHOLD
    ? VIRTUALIZATION_CONFIG.SAFETY_MARGIN_LARGE
    : VIRTUALIZATION_CONFIG.SAFETY_MARGIN_DEFAULT;
}

/**
 * Measure average character width using the Canvas API.
 * @param font - CSS font string (e.g., "12px Monaco")
 * @returns Average character width in pixels
 */
export function measureAverageCharWidth(font: string): number {
  try {
    if (!sharedCanvas) {
      sharedCanvas = document.createElement('canvas');
    }
    const context = sharedCanvas.getContext('2d');

    if (!context) {
      return VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH;
    }

    context.font = font;

    // Use a diverse sample string to improve measurement accuracy
    const sampleText = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const sampleWidth = context.measureText(sampleText).width;

    return sampleWidth > 0
      ? sampleWidth / sampleText.length
      : VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH;
  } catch (error) {
    // Catch potential DOM exceptions (e.g., canvas disabled in specific environments)
    return VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH;
  }
}

/**
 * Calculate how many characters fit per line in the content area.
 * @param container - The scroll container element
 * @param avgCharWidth - Average character width in pixels
 * @returns Number of characters that fit per line (minimum 1)
 */
export function calculateCharsPerLine(container: HTMLElement, avgCharWidth: number): number {
  if (!container) return VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE;

  // 1. Calculate gutter (line numbers) width
  let gutterWidth = 0;
  const gutterElement = container.querySelector('.line-number__gutter');
  if (gutterElement instanceof HTMLElement) {
    gutterWidth = gutterElement.offsetWidth;
  }

  // 2. Determine base available width
  let contentWidth = container.clientWidth - gutterWidth;

  // 3. Subtract horizontal padding from the content column
  const contentColumn = container.querySelector('.log-content__content-column');
  if (contentColumn instanceof HTMLElement) {
    const contentStyle = window.getComputedStyle(contentColumn);
    const paddingLeft = parseFloat(contentStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(contentStyle.paddingRight) || 0;
    contentWidth -= paddingLeft + paddingRight;
  }

  // 4. Calculate final count with safety fallback
  const safeCharWidth = avgCharWidth > 0 ? avgCharWidth : VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH;
  const charsPerLine = Math.floor(Math.max(0, contentWidth) / safeCharWidth);

  // Return calculated value or fallback, ensuring it is at least 1 to avoid division by zero later
  return charsPerLine > 0 ? charsPerLine : VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE;
}
