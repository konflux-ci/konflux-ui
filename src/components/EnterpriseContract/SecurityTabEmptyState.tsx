import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateProps,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { PIPELINERUN_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import SecurityShieldImg from '../../assets/shield-security.svg';

import '../../shared/components/empty-state/EmptyState.scss';

const EmptyStateImg = () => <SecurityShieldImg className="app-empty-state__icon" role="img" />;

const SecurityTabEmptyState: React.FC<
  React.PropsWithChildren<Omit<EmptyStateProps, 'children'>>
> = ({ ...props }) => {
  const navigate = useNavigate();
  const { applicationName, pipelineRunName, workspaceName } = useParams<RouterParams>();
  return (
    <EmptyState
      className="app-empty-state"
      data-test="security-tab-empty-state"
      variant={EmptyStateVariant.full}
      {...props}
    >
      <EmptyStateHeader
        titleText="Security information unavailable"
        icon={<EmptyStateIcon icon={EmptyStateImg} />}
        headingLevel="h2"
      />
      <EmptyStateBody>We don&apos;t have any logs to show right now.</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            variant={ButtonVariant.primary}
            onClick={() =>
              navigate(
                PIPELINERUN_DETAILS_PATH.createPath({
                  workspaceName,
                  applicationName,
                  pipelineRunName,
                }),
              )
            }
          >
            Return to pipeline run details
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default SecurityTabEmptyState;
