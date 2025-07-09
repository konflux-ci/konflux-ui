import React from 'react';
import { Banner } from '@patternfly/react-core';
import { BannerType, useBanner } from '~/hooks/useBanner';
import { BannerContent } from './BannerContent';

const typeToVariant = (type: BannerType): 'blue' | 'gold' | 'red' => {
  switch (type) {
    case 'info':
      return 'blue';
    case 'warning':
      return 'gold';
    case 'danger':
      return 'red';
    default:
      return 'blue';
  }
};

export const KonfluxBanner: React.FC = () => {
  const banner = useBanner();
  if (!banner) return null;

  return (
    <Banner isSticky variant={typeToVariant(banner.type)} data-test="banner">
      <BannerContent type={banner.type} summary={banner.summary} />
    </Banner>
  );
};
