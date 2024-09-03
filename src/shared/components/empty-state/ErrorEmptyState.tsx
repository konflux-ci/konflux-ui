import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateProps,
  EmptyStateVariant,
  Title,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { css } from '@patternfly/react-styles';
import { HttpError } from '../../../k8s/error';
import { NotFoundEmptyState } from './NotFoundEmptyState';

import './EmptyState.scss';

type ErrorEmptyStateProps = {
  httpError?: HttpError;
  title?: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
} & Omit<EmptyStateProps, 'children'>;

const ErrorEmptyState: React.FC<React.PropsWithChildren<ErrorEmptyStateProps>> = ({
  title,
  body,
  httpError,
  className,
  children,
  ...props
}) => {
  if (httpError?.code === 404) {
    return <NotFoundEmptyState className={className} {...props} />;
  }
  return (
    <EmptyState
      className={css('app-empty-state', className)}
      variant={EmptyStateVariant.full}
      {...props}
    >
      <EmptyStateHeader
        icon={
          <EmptyStateIcon
            className={css('app-empty-state__icon m-is-error')}
            icon={ExclamationCircleIcon}
          />
        }
      />
      <EmptyStateFooter>
        {title ? (
          <Title className="pf-v5-u-mt-lg" headingLevel="h2" size="lg">
            {title}
          </Title>
        ) : null}
        {body ? <EmptyStateBody>{body}</EmptyStateBody> : null}
        {children}
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default ErrorEmptyState;
