import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';

type LoadingSkeletonDirection = 'vertical' | 'horizontal' | 'grid';

export type LoadingSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  count?: number;
  widths?: string | string[];
  height?: string;
  shape?: 'circle' | 'square';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  direction?: LoadingSkeletonDirection;
  gap?: string;
  columns?: number;
  screenreaderText?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
};

const getWidthsArray = (
  count: number,
  widths?: string | string[],
  defaultWidth = '100%',
): (string | undefined)[] => {
  if (!widths) {
    // Provide a slightly shorter last line for a more natural look
    return Array.from({ length: count }, (_, idx) =>
      idx === count - 1 && count > 1 ? '75%' : defaultWidth,
    );
  }
  if (typeof widths === 'string') {
    return Array.from({ length: count }, () => widths);
  }
  if (Array.isArray(widths) && widths.length > 0) {
    return Array.from({ length: count }, (_, idx) => widths[idx % widths.length]);
  }
  return Array.from({ length: count }, () => defaultWidth);
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  count = 1,
  widths,
  height,
  shape,
  fontSize,
  direction = 'vertical',
  gap = '0.5rem',
  columns = 3,
  screenreaderText = 'Loading content',
  style,
  'aria-label': ariaLabel = 'Loading',
  ...rest
}) => {
  const isGrid = direction === 'grid';
  const isHorizontal = direction === 'horizontal';
  const widthsArray = getWidthsArray(count, widths, isGrid ? undefined : '100%');

  const containerStyle: React.CSSProperties = {
    display: isGrid ? 'grid' : 'flex',
    gap,
    flexDirection: isGrid ? undefined : isHorizontal ? 'row' : 'column',
    gridTemplateColumns: isGrid ? `repeat(${columns}, minmax(0, 1fr))` : undefined,
    alignItems: isHorizontal ? 'center' : undefined,
    ...style,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
      {...rest}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width={widthsArray[index]}
          height={height}
          shape={shape}
          fontSize={fontSize}
          screenreaderText={screenreaderText}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
