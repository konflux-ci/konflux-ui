import React from 'react';
import { Flex } from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { SyncMarkdownView } from '~/shared/components/markdown-view/MarkdownView';
import { BannerConfig, BannerType, BannerVariant } from '~/types/banner-type';

type BannerContentProps = Pick<BannerConfig, 'type' | 'summary'>;

// Map BannerType → BannerVariant
export const bannerTypeToVariant: Record<BannerType, BannerVariant> = {
  info: BannerVariant.BLUE,
  warning: BannerVariant.GOLD,
  danger: BannerVariant.RED,
};

// Map BannerVariant → Icon component
const bannerVariantToIcon: Record<BannerVariant, JSX.Element> = {
  [BannerVariant.BLUE]: <InfoCircleIcon data-test="info-icon" />,
  [BannerVariant.GOLD]: <BellIcon data-test="warning-icon" />,
  [BannerVariant.RED]: <ExclamationTriangleIcon data-test="danger-icon" />,
};

export const BannerContent: React.FC<BannerContentProps> = React.memo(({ type, summary }) => (
  <Flex
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentCenter' }}
    flexWrap={{ default: 'nowrap' }}
    spaceItems={{ default: 'spaceItemsSm' }}
  >
    {bannerVariantToIcon[bannerTypeToVariant[type]]}
    <SyncMarkdownView content={summary} inline />
  </Flex>
));
