import * as React from 'react';
import './SpotlightOverlay.scss';

interface SpotlightOverlayProps {
  targetRect: DOMRect;
  padding?: number;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({ targetRect, padding = 8 }) => {
  const maskId = React.useId();
  const x = targetRect.x - padding;
  const y = targetRect.y - padding;
  const width = targetRect.width + padding * 2;
  const height = targetRect.height + padding * 2;

  return (
    <>
      <div className="guided-tours__click-blocker" data-test="tour-click-blocker" />
      <svg className="guided-tours__overlay" data-test="tour-spotlight-overlay" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              className="guided-tours__overlay-cutout"
              x={x}
              y={y}
              width={width}
              height={height}
              rx="4"
            />
          </mask>
        </defs>
        <rect
          className="guided-tours__overlay-backdrop"
          x="0"
          y="0"
          width="100%"
          height="100%"
          mask={`url(#${maskId})`}
        />
      </svg>
    </>
  );
};
