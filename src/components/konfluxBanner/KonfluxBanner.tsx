import React from 'react';
import { Banner, Flex, FlexItem } from '@patternfly/react-core';
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
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentCenter' }}
        flexWrap={{ default: 'nowrap' }}
        style={{ width: '100%' }}
      >
        <FlexItem>
          <BannerContent type={banner.type} summary={banner.summary} />
        </FlexItem>
      </Flex>
    </Banner>
  );
};
