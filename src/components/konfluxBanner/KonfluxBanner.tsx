import React from 'react';
import { Banner } from '@patternfly/react-core';
import { useBanner } from '~/hooks/useBanner';
import { BannerType } from '~/types/banner';
import { BannerContent } from './BannerContent';

const typeToVariantMap: Record<BannerType, 'blue' | 'gold' | 'red'> = {
  info: 'blue',
  warning: 'gold',
  danger: 'red',
};

const typeToVariant = (type: BannerType): 'blue' | 'gold' | 'red' =>
  typeToVariantMap[type] || 'blue';

export const KonfluxBanner: React.FC = () => {
  const banner = useBanner();
  if (!banner) return null;

  return (
    <Banner isSticky variant={typeToVariant(banner.type)} data-test="banner">
      <BannerContent type={banner.type} summary={banner.summary} />
    </Banner>
  );
};
