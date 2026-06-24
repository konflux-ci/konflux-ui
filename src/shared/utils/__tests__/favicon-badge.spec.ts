import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_black_400 as grayColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { runStatus } from '~/consts/pipelinerun';
import {
  acquireFaviconBadge,
  applyFaviconBadge,
  compositeFaviconWithBadge,
  getFaviconBadgeColor,
  getFaviconLink,
  releaseFaviconBadge,
  resetFaviconBadgeStateForTests,
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
    resetFaviconBadgeStateForTests();
    document.head.innerHTML = '';
  });

  describe('getFaviconBadgeColor', () => {
    it.each([
      [runStatus.Succeeded, greenColor.value],
      [runStatus.Failed, redColor.value],
      [runStatus.FailedToStart, redColor.value],
      [runStatus.TestFailed, redColor.value],
      [runStatus.Running, blueColor.value],
      [runStatus['In Progress'], blueColor.value],
      [runStatus.Cancelled, goldColor.value],
      [runStatus.Cancelling, goldColor.value],
      [runStatus.TestWarning, warningColor.value],
      [runStatus.PipelineNotStarted, orangeColor.value],
      [runStatus.Idle, grayColor.value],
      [runStatus.Pending, grayColor.value],
      [runStatus.Skipped, grayColor.value],
      [runStatus.Unknown, grayColor.value],
      [runStatus.NeedsMerge, grayColor.value],
    ])('maps %s to %s', (status, expected) => {
      expect(getFaviconBadgeColor(status)).toBe(expected);
    });
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

    it('captures the original favicon href before mutation', () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/favicon.ico';
      document.head.appendChild(link);

      acquireFaviconBadge();
      setFaviconHref('data:image/png;base64,badged');

      expect(link.href).toBe('data:image/png;base64,badged');
      releaseFaviconBadge();
      expect(link.href).toBe('https://example.com/favicon.ico');
    });

    it('restores the default favicon when no consumer holds ownership', () => {
      acquireFaviconBadge();
      releaseFaviconBadge();

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

    it('restores favicon when status is null', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      acquireFaviconBadge();
      setFaviconHref('data:image/png;base64,badged');

      await applyFaviconBadge(null);

      expect(link.href).toContain('/favicon.ico');
      releaseFaviconBadge();
    });

    it('applies a gray badged favicon for inactive statuses', async () => {
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

      acquireFaviconBadge();
      await applyFaviconBadge(runStatus.Pending);

      expect(link.href).toBe('data:image/png;base64,gray-badged');
      expect(mockContext.fillStyle).toBe(grayColor.value);
      releaseFaviconBadge();
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

      acquireFaviconBadge();
      await applyFaviconBadge(runStatus.Running);

      expect(link.href).toBe('data:image/png;base64,badged');
      releaseFaviconBadge();
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
      acquireFaviconBadge();
      const applyPromise = applyFaviconBadge(runStatus.Running, () => cancelled);
      cancelled = true;
      resolveLoad?.();
      await applyPromise;
      releaseFaviconBadge();

      expect(link.href).toContain('/favicon.ico');
    });

    it('restores favicon when image load fails', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      mockFaviconImageLoadError();

      acquireFaviconBadge();
      await applyFaviconBadge(runStatus.Failed);
      releaseFaviconBadge();

      expect(link.href).toContain('/favicon.ico');
    });

    it('does not restore baseline while another consumer remains active', async () => {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'https://example.com/favicon.ico';
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
        .mockReturnValue('data:image/png;base64,active-badged');

      mockFaviconImageLoadSuccess();

      acquireFaviconBadge();
      acquireFaviconBadge();
      await applyFaviconBadge(runStatus.Running);
      expect(link.href).toBe('data:image/png;base64,active-badged');

      releaseFaviconBadge();
      expect(link.href).toBe('data:image/png;base64,active-badged');

      releaseFaviconBadge();
      expect(link.href).toBe('https://example.com/favicon.ico');
    });
  });
});
