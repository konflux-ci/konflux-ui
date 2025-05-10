import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Alert, Button, Tooltip } from '@patternfly/react-core';
import { useBanner } from './hooks/useBanner';
import './Banner.scss';

export const KonfluxBanner: React.FC = () => {
  const { data: banner, isLoading, error } = useBanner();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosed, setIsClosed] = React.useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  if (isLoading || error || !banner) return null;

  return (
    <div ref={bannerRef} className={`konflux-banner-fixed ${isClosed ? 'collapsed' : ''}`}>
      <div className="konflux-banner-content">
        <Alert
          variant={banner.type}
          title={banner.title}
          isInline
          actionClose={
            !isClosed && (
              <Tooltip content="Collapsed. Hover to view.">
                <Button
                  variant="plain"
                  onClick={() => {
                    setIsClosed(true);
                  }}
                >
                  collapse
                </Button>
              </Tooltip>
            )
          }
        >
          <div className="banner-inline-content">
            <span className="banner-message">{banner.message}</span>
            {banner.details && (
              <Button
                variant="link"
                isInline
                onClick={() => setIsExpanded(!isExpanded)}
                className="banner-toggle-button"
              >
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
        </Alert>
      </div>
    </div>
  );
};
