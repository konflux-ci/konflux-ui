import React from 'react';
import { Banner } from '@patternfly/react-core';
import { useBanner } from '~/components/KonfluxBanner/useBanner';
import { BannerContent, bannerTypeToVariant } from './BannerContent';

export const KonfluxBanner: React.FC = () => {
  const banner = useBanner();
  if (!banner) return null;

  return (
    <Banner isSticky variant={bannerTypeToVariant[banner.type]}>
      <BannerContent type={banner.type} summary={banner.summary} />
    </Banner>
  );
};
