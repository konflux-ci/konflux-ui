import * as React from 'react';
import { Tr } from '@patternfly/react-table';
import { useResizeObserver } from '~/shared/hooks';

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
  useResizeObserver(() => {
    window.requestAnimationFrame(() => {
      recompute?.();
    });
  }, ref.current);

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
