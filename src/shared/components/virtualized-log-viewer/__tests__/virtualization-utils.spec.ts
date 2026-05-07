import {
  VIRTUALIZATION_CONFIG,
  getOverscanCount,
  getSafetyMargin,
  measureAverageCharWidth,
  calculateCharsPerLine,
} from '../virtualization-utils';

describe('virtualization-utils', () => {
  describe('VIRTUALIZATION_CONFIG', () => {
    it('should have correct default values', () => {
      expect(VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH).toBe(8);
      expect(VIRTUALIZATION_CONFIG.DEFAULT_OVERSCAN).toBe(50);
    });
  });

  describe('getOverscanCount', () => {
    it('should return lineCount for tiny logs', () => {
      expect(getOverscanCount(50)).toBe(50);
    });

    it('should return DEFAULT_OVERSCAN for large logs', () => {
      expect(getOverscanCount(500)).toBe(VIRTUALIZATION_CONFIG.DEFAULT_OVERSCAN);
    });
  });

  describe('getSafetyMargin', () => {
    it('should switch margin based on threshold', () => {
      const threshold = VIRTUALIZATION_CONFIG.LARGE_LOG_THRESHOLD;
      expect(getSafetyMargin(threshold)).toBe(VIRTUALIZATION_CONFIG.SAFETY_MARGIN_DEFAULT);
      expect(getSafetyMargin(threshold + 1)).toBe(VIRTUALIZATION_CONFIG.SAFETY_MARGIN_LARGE);
    });
  });

  describe('measureAverageCharWidth', () => {
    let mockContext: Partial<CanvasRenderingContext2D>;

    beforeEach(() => {
      mockContext = {
        font: '',
        measureText: jest.fn().mockReturnValue({ width: 620 } as TextMetrics),
      };

      // Fixes unbound-method and unsafe-argument errors
      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as CanvasRenderingContext2D);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should measure average character width using Canvas API', () => {
      const result = measureAverageCharWidth('12px Monaco');
      expect(mockContext.font).toBe('12px Monaco');
      expect(result).toBe(10);
    });

    it('should return fallback if getContext is not supported', () => {
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
      const result = measureAverageCharWidth('12px Monaco');
      expect(result).toBe(VIRTUALIZATION_CONFIG.FALLBACK_CHAR_WIDTH);
    });
  });

  describe('calculateCharsPerLine', () => {
    let mockContainer: HTMLDivElement;
    let mockGutter: HTMLDivElement;
    let mockContent: HTMLDivElement;

    const setWidth = (el: HTMLElement, prop: 'clientWidth' | 'offsetWidth', val: number): void => {
      Object.defineProperty(el, prop, { configurable: true, value: val });
    };

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockGutter = document.createElement('div');
      mockGutter.className = 'line-number__gutter';
      mockContent = document.createElement('div');
      mockContent.className = 'log-content__content-column';

      mockContainer.appendChild(mockGutter);
      mockContainer.appendChild(mockContent);

      setWidth(mockContainer, 'clientWidth', 1000);
      setWidth(mockGutter, 'offsetWidth', 60);

      // Explicitly type the selector to avoid unsafe-argument errors
      jest
        .spyOn(mockContainer, 'querySelector')
        .mockImplementation((selector: string): HTMLElement | null => {
          if (selector === '.line-number__gutter') return mockGutter;
          if (selector === '.log-content__content-column') return mockContent;
          return null;
        });

      jest.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
        if (el === mockContent) {
          return { paddingLeft: '10px', paddingRight: '10px' } as CSSStyleDeclaration;
        }
        return {} as CSSStyleDeclaration;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should calculate chars correctly (1000 - 60 - 20) / 8 = 115', () => {
      const result = calculateCharsPerLine(mockContainer, 8);
      expect(result).toBe(115);
    });

    it('should return fallback if calculation results in 0 or less', () => {
      setWidth(mockContainer, 'clientWidth', 10);
      const result = calculateCharsPerLine(mockContainer, 8);
      expect(result).toBe(VIRTUALIZATION_CONFIG.FALLBACK_CHARS_PER_LINE);
    });
  });
});
