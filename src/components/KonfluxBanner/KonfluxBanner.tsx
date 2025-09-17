import React from 'react';
import { Banner } from '@patternfly/react-core';
import { useBanner } from '~/components/KonfluxBanner/useBanner';
import { useResizeObserver } from '~/shared/hooks';
import { BannerContent, bannerTypeToVariant } from './BannerContent';

export const KonfluxBanner: React.FC = () => {
  const banner = useBanner();
  const [bannerElement, setBannerElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!banner) {
      document.documentElement.style.setProperty('--konflux-banner-height', '0px');
      return;
    }

    const element = document.getElementById('konflux-banner');
    setBannerElement(element);
  }, [banner]);

  const updateBannerHeight = React.useCallback(() => {
    if (bannerElement) {
      const height = bannerElement.offsetHeight;
      document.documentElement.style.setProperty('--konflux-banner-height', `${height}px`);
    }
  }, [bannerElement]);

  useResizeObserver(updateBannerHeight, bannerElement);

  if (!banner) return null;

  return (
    <Banner isSticky variant={bannerTypeToVariant[banner.type]} id="konflux-banner">
      <BannerContent type={banner.type} summary={banner.summary} />
    </Banner>
  );
};
