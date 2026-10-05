import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateProps,
  EmptyStateVariant,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { PIPELINERUN_DETAILS_PATH, NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import SecurityShieldImg from '../../assets/shield-security.svg';

import '../../shared/components/empty-state/EmptyState.scss';

const EmptyStateImg = () => <SecurityShieldImg className="app-empty-state__icon" role="img" />;

const SecurityTabEmptyState: React.FC<
  React.PropsWithChildren<Omit<EmptyStateProps, 'children'> & { pipelineRunName?: string }>
> = ({ pipelineRunName: parentName, ...props }) => {
  const navigate = useNavigate();
  const { applicationName, pipelineRunName, workspaceName } = useParams<RouterParams>();
  const pipelineParams = {
    workspaceName,
    applicationName,
    pipelineRunName: parentName || pipelineRunName,
  };
  return (
    <EmptyState
      headingLevel="h2"
      icon={EmptyStateImg}
      titleText="Security information unavailable"
      className="app-empty-state"
      data-test="security-tab-empty-state"
      variant={EmptyStateVariant.full}
      {...props}
    >
      <EmptyStateBody>We don&apos;t have any logs to show right now.</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            variant={ButtonVariant.primary}
            onClick={() =>
              navigate(
                (applicationName
                  ? PIPELINERUN_DETAILS_PATH
                  : NAMESPACE_PIPELINE_RUN_DETAILS_PATH
                ).createPath(pipelineParams),
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
