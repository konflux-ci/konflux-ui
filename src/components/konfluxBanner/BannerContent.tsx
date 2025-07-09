import React from 'react';
import { Flex } from '@patternfly/react-core';
import { BellIcon } from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { SyncMarkdownView } from '~/shared/components/markdown-view/MarkdownView';

export type BannerType = 'info' | 'warning' | 'danger';

type BannerContentProps = {
  type: BannerType;
  summary: string;
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

export const BannerContent: React.FC<BannerContentProps> = React.memo(({ type, summary }) => (
  <Flex
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentCenter' }}
    flexWrap={{ default: 'nowrap' }}
    spaceItems={{ default: 'spaceItemsSm' }}
    style={{ width: '100%' }}
  >
    {typeToIcon(type)}
    <SyncMarkdownView content={summary} inline />
  </Flex>
));
