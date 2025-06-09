import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateProps,
  EmptyStateVariant,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { LockIcon } from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import { css } from '@patternfly/react-styles';
import { HttpError } from '../../k8s/error';

import '../../shared/components/empty-state/EmptyState.scss';

type NoAccessStateProps = {
  httpError?: HttpError;
  title?: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
} & Omit<EmptyStateProps, 'children'>;

const getAccessedNamespace = (pathname: string) => {
  const pathnameParts = pathname.split('/');
  return pathnameParts.length >= 3 && pathnameParts[1] === 'ns' ? pathnameParts[2] : undefined;
};

const NoAccessState: React.FC<React.PropsWithChildren<NoAccessStateProps>> = ({
  title,
  body,
  className,
  children,
  ...props
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const accessedNamespace = getAccessedNamespace(pathname);

  return (
    <EmptyState
      className={css('app-empty-state', className)}
      variant={EmptyStateVariant.full}
      {...props}
      data-test="no-access-state"
    >
      <EmptyStateHeader
        titleText={<>{title || `Let's get you access`}</>}
        icon={<EmptyStateIcon className={css('app-empty-state__icon ')} icon={LockIcon} />}
        headingLevel="h2"
      />
      <EmptyStateBody>
        {body ||
          (accessedNamespace
            ? `Ask the administrator or the owner of the '${accessedNamespace}' namespace for access permissions.`
            : "You don't have access to this page.")}
      </EmptyStateBody>
      <EmptyStateFooter>
        {children || (
          <Button
            variant={ButtonVariant.primary}
            data-test="no-access-action"
            onClick={() => navigate('/')}
          >
            Go to Overview page
          </Button>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default NoAccessState;
