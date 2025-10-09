import { render, waitFor } from '@testing-library/react';
import * as useBannerHook from '~/components/KonfluxBanner/useBanner';
import { useResizeObserver } from '../../../shared/hooks';
import { KonfluxBanner } from '../KonfluxBanner';

jest.mock('../useBanner', () => ({
  useBanner: jest.fn(),
}));

jest.mock('../../../shared/hooks', () => ({
  useResizeObserver: jest.fn(),
  useForceRender: jest.fn(() => jest.fn()),
}));

const userBannerMock = useBannerHook.useBanner as jest.Mock;
const mockUseResizeObserver = useResizeObserver as jest.Mock;

describe('KonfluxBanner', () => {
  let mockSetProperty: jest.SpyInstance;

  beforeEach(() => {
    // Mock document.documentElement.style.setProperty
    mockSetProperty = jest.spyOn(document.documentElement.style, 'setProperty');
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockSetProperty.mockRestore();
    mockUseResizeObserver.mockClear();
  });

  it('renders nothing if useBanner returns null', () => {
    userBannerMock.mockReturnValue(null);
    const { container } = render(<KonfluxBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('sets CSS custom property to 0px when no banner is active', async () => {
    userBannerMock.mockReturnValue(null);

    render(<KonfluxBanner />);

    await waitFor(() => {
      expect(mockSetProperty).toHaveBeenCalledWith('--konflux-banner-height', '0px');
    });
  });

  it('sets CSS custom property with banner height when banner is active', async () => {
    userBannerMock.mockReturnValue({ type: 'info', summary: 'Test banner' });

    // Create a mock element with offsetHeight before rendering
    const mockElement = document.createElement('div');
    mockElement.id = 'konflux-banner';
    Object.defineProperty(mockElement, 'offsetHeight', {
      configurable: true,
      value: 50,
    });

    // Mock getElementById to return our mock element
    const mockGetElementById = jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);

    render(<KonfluxBanner />);

    // Wait for useResizeObserver to be called
    await waitFor(() => {
      expect(mockUseResizeObserver).toHaveBeenCalled();
    });

    // Wait for useResizeObserver to be called with the element (second call)
    await waitFor(() => {
      expect(mockUseResizeObserver.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(mockUseResizeObserver.mock.calls[1][1]).toBeTruthy(); // Element should not be null
    });

    // Get the callback from the second call (when element is available)
    const resizeObserverCallback = mockUseResizeObserver.mock.calls[1][0];

    // Manually trigger the callback to simulate resize observer firing
    if (resizeObserverCallback) {
      resizeObserverCallback();
    }

    // Now check that the CSS property was set
    await waitFor(() => {
      expect(mockSetProperty).toHaveBeenCalledWith('--konflux-banner-height', '50px');
    });

    mockGetElementById.mockRestore();
  });

  it('applies correct id for CSS targeting', () => {
    userBannerMock.mockReturnValue({ type: 'info', summary: 'Test banner' });

    const { container } = render(<KonfluxBanner />);
    const banner = container.querySelector('#konflux-banner');

    expect(banner).toBeInTheDocument();
  });

  it('resets CSS custom property when banner changes from defined to undefined', async () => {
    // Start with an active banner
    userBannerMock.mockReturnValue({ type: 'info', summary: 'Test banner' });

    const { rerender } = render(<KonfluxBanner />);

    // Change to no banner
    userBannerMock.mockReturnValue(null);
    rerender(<KonfluxBanner />);

    await waitFor(() => {
      expect(mockSetProperty).toHaveBeenCalledWith('--konflux-banner-height', '0px');
    });
  });
});
