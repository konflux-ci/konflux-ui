import { render, screen } from '@testing-library/react';
import { BannerType } from '~/hooks/useBanner';
import * as useBannerHook from '~/hooks/useBanner';
import { KonfluxBanner } from '../KonfluxBanner';

jest.mock('~/hooks/useBanner', () => ({
  __esModule: true,
  ...jest.requireActual('~/hooks/useBanner'),
  useBanner: jest.fn(), // mock useBanner
}));
const userBannerMock = useBannerHook.useBanner as jest.Mock;

describe('KonfluxBanner', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders nothing if useBanner returns null', () => {
    userBannerMock.mockReturnValue(null);
    const { container } = render(<KonfluxBanner />);
    expect(container.firstChild).toBeNull();
  });

  const testCases = [
    {
      type: 'info' as BannerType,
      summary: 'Info message',
      expectedVariant: 'pf-m-blue',
    },
    {
      type: 'warning' as BannerType,
      summary: 'Warning message',
      expectedVariant: 'pf-m-gold',
    },
    {
      type: 'danger' as BannerType,
      summary: 'Danger message',
      expectedVariant: 'pf-m-red',
    },
  ];

  it.each(testCases)(
    'renders $type banner with correct icon and summary',
    ({ type, summary, expectedVariant }) => {
      userBannerMock.mockReturnValue({ type, summary });
      render(<KonfluxBanner />);
      const banner = screen.getByTestId('banner');
      expect(banner).toHaveClass(expectedVariant);
      // Check icon is present
      const icon = screen.getByTestId(`${type}-icon`);
      expect(icon).toBeInTheDocument();
      // Check summary text is present
      expect(screen.getByText(summary)).toBeInTheDocument();
    },
  );
});
