import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { css } from '@patternfly/react-styles';

import '~/shared/components/empty-state/EmptyState.scss';

const EmptyStateImg = () => (
  <ExclamationCircleIcon className="app-empty-state__icon m-is-error" role="img" />
);

const ServiceUnavailablePage: React.FC<{ errorMessage: string }> = ({ errorMessage }) => {
  const navigate = useNavigate();

  return (
    <EmptyState
      className={css('app-empty-state')}
      variant={EmptyStateVariant.full}
      data-test="service-unavailable-state"
      titleText="Service unavailable"
      icon={EmptyStateImg}
      headingLevel="h2"
    >
      <EmptyStateBody>{errorMessage}</EmptyStateBody>
      <EmptyStateFooter>
        <Button
          variant={ButtonVariant.primary}
          data-test="service-unavailable-action"
          onClick={() => navigate('/')}
        >
          Go to Overview page
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default ServiceUnavailablePage;
