import React from 'react';
import { Banner, Flex, FlexItem } from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { BannerType, useBanner } from '~/hooks/useBanner';

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

const typeToIcon = (type: BannerType) => {
  switch (type) {
    case 'info':
      return <InfoCircleIcon data-test="info-icon" />;
    case 'warning':
      return <BellIcon data-test="warning-icon" />;
    case 'danger':
      return <ExclamationTriangleIcon data-test="danger-icon" />;
    default:
      return <InfoCircleIcon data-test="info-icon" />;
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
          {typeToIcon(banner.type)} {banner.summary}
        </FlexItem>
      </Flex>
    </Banner>
  );
};
