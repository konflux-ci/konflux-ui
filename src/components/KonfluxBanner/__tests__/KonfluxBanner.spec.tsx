import { render, screen } from '@testing-library/react';
import * as useBannerHook from '~/components/KonfluxBanner/useBanner';
import { BannerType } from '~/types/banner-type';
import { KonfluxBanner } from '../KonfluxBanner';

jest.mock('../useBanner', () => ({
  useBanner: jest.fn(),
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
      const { container } = render(<KonfluxBanner />);
      const banner = container.querySelector('.pf-v5-c-banner');
      expect(banner).toHaveClass(expectedVariant);
      // Check icon is present
      const icon = screen.getByTestId(`${type}-icon`);
      expect(icon).toBeInTheDocument();
      // Check summary text is present
      expect(screen.getByText(summary)).toBeInTheDocument();
    },
  );
});
