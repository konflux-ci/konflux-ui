import * as React from 'react';
import { Tr } from '@patternfly/react-table';
import { useMutationObserver } from '~/shared/hooks';

export type TableRowProps = {
  id: React.ReactText;
  index: number;
  title?: string;
  trKey: string;
  style?: object;
  className?: string;
  isExpanded?: boolean;
  recompute?: () => void;
};

export const TableRow: React.FC<React.PropsWithChildren<TableRowProps>> = ({
  id,
  index,
  trKey,
  style,
  className,
  recompute,
  ...props
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);

  useMutationObserver(
    (mutations) => {
      const hasRelevantChanges = mutations.some((mutation) => {
        return (
          mutation.type === 'childList' ||
          (mutation.type === 'attributes' &&
            (mutation.attributeName === 'class' ||
              mutation.attributeName === 'style' ||
              mutation.attributeName === 'aria-expanded'))
        );
      });

      if (hasRelevantChanges) {
        recompute?.();
      }
    },
    recompute ? ref.current : null,
    {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-expanded'],
    },
  );

  return (
    <Tr
      {...props}
      ref={ref}
      data-id={id}
      data-index={index}
      data-test-rows="resource-row"
      data-test={id}
      data-key={trKey}
      style={style}
      className={className}
      role="row"
    />
  );
};
