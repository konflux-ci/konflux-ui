import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Banner, Button, Flex, FlexItem } from '@patternfly/react-core';
// eslint-disable-next-line no-restricted-imports
import { BellIcon, ExclamationTriangleIcon, InfoCircleIcon } from '@patternfly/react-icons';
import { useBanner } from './hooks/useBanner';
import './Banner.scss';

type BannerType = 'info' | 'warning' | 'danger';

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
      return <InfoCircleIcon />;
    case 'warning':
      return <BellIcon />;
    case 'danger':
      return <ExclamationTriangleIcon />;
    default:
      return <InfoCircleIcon />;
  }
};

export const KonfluxBanner: React.FC = () => {
  const { data: banner, isLoading, error } = useBanner();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDetails = useCallback(() => {
    setIsExpanded((expanded) => !expanded);
  }, []);

  if (isLoading || error || !banner) return null;

  return (
    <Banner
      isSticky
      screenReaderText={banner.title}
      variant={typeToVariant(banner.type as BannerType)}
      title={banner.title}
    >
      <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>{typeToIcon(banner.type)}</FlexItem>
        <FlexItem>{banner.title}</FlexItem>
      </Flex>

      <div className="banner-inline-content">
        <span className="banner-message">{banner.message}</span>
        {banner.details && (
          <Button variant="link" isInline onClick={toggleDetails} className="banner-toggle-button">
            {isExpanded ? '>> Hide details' : '>> Show details'}
          </Button>
        )}
      </div>

      {isExpanded && banner.details && (
        <div className="banner-details">
          <ReactMarkdown>{banner.details}</ReactMarkdown>
        </div>
      )}

      <div className="konflux-banner-footer">
        Banner content sourced from{' '}
        <a
          href="https://github.com/testcara/konflux-banner"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://github.com/testcara/konflux-banner
        </a>
        .
      </div>
    </Banner>
  );
};
