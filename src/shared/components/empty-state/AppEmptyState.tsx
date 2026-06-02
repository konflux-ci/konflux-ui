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
  emptyStateImg,
  isXl,
  className,
  title,
  children,
  ...props
}) => (
  <EmptyState
    headingLevel="h3"
    titleText={<>{title}</>}
    className={css('app-empty-state m-is-top-level', className)}
    {...props}
  >
    <EmptyStateFooter>{children}</EmptyStateFooter>
  </EmptyState>
);

export default AppEmptyState;
