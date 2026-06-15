import * as React from 'react';
import { EmptyState, EmptyStateProps, EmptyStateFooter } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';

import './EmptyState.scss';

type AppEmptyStateProps = {
  emptyStateImg: React.ComponentType<SVGSVGElement> | string;
  isXl?: boolean;
  title: React.ReactNode;
} & EmptyStateProps;

const AppEmptyState: React.FC<React.PropsWithChildren<AppEmptyStateProps>> = ({
  className,
  title,
  children,
  emptyStateImg,
  isXl,
  ...props
}) => {
  const EmptyStateImage = React.useMemo(
    () =>
      typeof emptyStateImg === 'string'
        ? () => (
            <img
              src={emptyStateImg}
              className={css('app-empty-state__icon', isXl && 'm-is-xl')}
              alt=""
            />
          )
        : () => {
            const SvgComponent = emptyStateImg as unknown as React.ComponentType<
              React.SVGProps<SVGSVGElement>
            >;
            return <SvgComponent className={css('app-empty-state__icon', isXl && 'm-is-xl')} />;
          },
    [emptyStateImg, isXl],
  );
  return (
    <EmptyState
      headingLevel="h3"
      titleText={title}
      icon={EmptyStateImage}
      className={css('app-empty-state m-is-top-level', className)}
      {...props}
    >
      <EmptyStateFooter>{children}</EmptyStateFooter>
    </EmptyState>
  );
};

export default AppEmptyState;
