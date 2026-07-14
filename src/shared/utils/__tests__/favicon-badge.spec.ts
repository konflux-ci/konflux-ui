import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_black_400 as grayColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import {
  applyFaviconBadge,
  compositeFaviconWithBadge,
  getFaviconLink,
  readFaviconHref,
  restoreFaviconHref,
  setFaviconHref,
} from '~/shared/utils/favicon-badge';

type MockImageElement = {
  onload: (() => void) | null;
  onerror: (() => void) | null;
};

const createMockImageConstructor = (onSetSrc: (image: MockImageElement) => void): typeof Image =>
  class MockImage {
    crossOrigin = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 32;
    width = 32;
    set src(_value: string) {
      onSetSrc(this);
    }
  } as unknown as typeof Image;

const mockFaviconImageLoadSuccess = (): void => {
  window.Image = createMockImageConstructor((image) => image.onload?.());
};

const mockFaviconImageLoadError = (): void => {
  window.Image = createMockImageConstructor((image) => image.onerror?.());
};

const mockFaviconImageLoadDeferred = (loadPromise: Promise<void>): void => {
  window.Image = createMockImageConstructor((image) => {
    void loadPromise.then(() => image.onload?.());
  });
};

describe('favicon-badge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = '';
  });

  describe('compositeFaviconWithBadge', () => {
    let mockContext: Partial<CanvasRenderingContext2D>;
    const mockToDataURL = jest.fn().mockReturnValue('data:image/png;base64,mock');

    beforeEach(() => {
      mockContext = {
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      };

      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
      jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(mockToDataURL);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('composites base image with a badge dot and returns a data URL', () => {
      const image = { naturalWidth: 32, width: 32 } as HTMLImageElement;

      const result = compositeFaviconWithBadge(image, blueColor.value);

      expect(mockContext.drawImage).toHaveBeenCalledWith(image, 0, 0, 32, 32);
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,mock');
    });

    it('returns null when canvas context is unavailable', () => {
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      const image = { naturalWidth: 32, width: 32 } as HTMLImageElement;
      const result = compositeFaviconWithBadge(image, blueColor.value);

      expect(result).toBeNull();
    });
  });

  describe('DOM helpers', () => {
    it('creates a favicon link when none exists', () => {
      const link = getFaviconLink();

      expect(link.rel).toBe('icon');
      expect(document.head.contains(link)).toBe(true);
    });

    it('returns the existing favicon link', () => {
      const existing = document.createElement('link');
      existing.rel = 'icon';
      existing.href = '/existing.ico';
      document.head.appendChild(existing);

      expect(getFaviconLink()).toBe(existing);
    });

    it('reads the current favicon href', () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/favicon.ico';
      document.head.appendChild(link);

      expect(readFaviconHref()).toBe('https://example.com/favicon.ico');
    });

    it('restores the original favicon href', () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/favicon.ico';
      document.head.appendChild(link);

      setFaviconHref('data:image/png;base64,badged');

      expect(link.href).toBe('data:image/png;base64,badged');
      restoreFaviconHref('https://example.com/favicon.ico');
      expect(link.href).toBe('https://example.com/favicon.ico');
    });

    it('restores the default favicon when no href is provided', () => {
      restoreFaviconHref();

      const link = getFaviconLink();
      expect(link.href).toContain('/favicon.ico');
    });
  });

  describe('applyFaviconBadge', () => {
    const originalImage = window.Image;

    afterEach(() => {
      window.Image = originalImage;
      jest.restoreAllMocks();
    });

    it('applies a badged favicon for the given color', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      const mockContext = {
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      };
      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockReturnValue('data:image/png;base64,unknown-badged');

      mockFaviconImageLoadSuccess();

      await applyFaviconBadge(grayColor.value, '/favicon.ico');

      expect(link.href).toBe('data:image/png;base64,unknown-badged');
      expect(mockContext.fillStyle).toBe(grayColor.value);
    });

    it('applies a gray badged favicon for gray colors', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      const mockContext = {
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      };
      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockReturnValue('data:image/png;base64,gray-badged');

      mockFaviconImageLoadSuccess();

      await applyFaviconBadge(grayColor.value, '/favicon.ico');

      expect(link.href).toBe('data:image/png;base64,gray-badged');
      expect(mockContext.fillStyle).toBe(grayColor.value);
    });

    it('updates the badged favicon when color changes', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      const mockContext = {
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
      };
      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockImplementation(() => `data:image/png;base64,${mockContext.fillStyle}`);

      mockFaviconImageLoadSuccess();

      await applyFaviconBadge(grayColor.value, '/favicon.ico');
      expect(link.href).toBe(`data:image/png;base64,${grayColor.value}`);

      await applyFaviconBadge(blueColor.value, '/favicon.ico');
      expect(link.href).toBe(`data:image/png;base64,${blueColor.value}`);
      expect(link.href).not.toContain('/favicon.ico');
    });

    it('applies a badged favicon when image loads successfully', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      const mockContext = {
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
      };
      jest
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(mockContext as unknown as CanvasRenderingContext2D);
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockReturnValue('data:image/png;base64,badged');

      mockFaviconImageLoadSuccess();

      await applyFaviconBadge(blueColor.value, '/favicon.ico');

      expect(link.href).toBe('data:image/png;base64,badged');
    });

    it('does not set favicon when cancelled before image load completes', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      let resolveLoad: (() => void) | undefined;
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve;
      });

      mockFaviconImageLoadDeferred(loadPromise);

      jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
      } as unknown as CanvasRenderingContext2D);
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockReturnValue('data:image/png;base64,badged');

      let cancelled = false;
      const applyPromise = applyFaviconBadge(blueColor.value, '/favicon.ico', () => cancelled);
      cancelled = true;
      resolveLoad?.();
      await applyPromise;

      expect(link.href).toContain('/favicon.ico');
    });

    it('restores favicon when image load fails', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      mockFaviconImageLoadError();

      await applyFaviconBadge(redColor.value, '/favicon.ico');

      expect(link.href).toContain('/favicon.ico');
    });

    it('restores favicon when canvas is unavailable', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/favicon.ico';
      document.head.appendChild(link);

      mockFaviconImageLoadSuccess();
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      await applyFaviconBadge(redColor.value, 'https://example.com/favicon.ico');
    });
  });
});
