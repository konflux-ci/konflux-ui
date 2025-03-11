import * as React from 'react';
import { Link } from 'react-router-dom';
import { EmptyStateBody, EmptyStateActions } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import emptyStateImgUrl from '../../assets/Pipeline.svg';
import { ComponentModel } from '../../models';
import { IMPORT_PATH } from '../../routes/paths';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';

interface PipelineRunEmptyStateProps {
  applicationName: string;
}

const PipelineRunEmptyState: React.FC<React.PropsWithChildren<PipelineRunEmptyStateProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');

  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Keep tabs on components and activity">
      <EmptyStateBody>
        Monitor your components with pipelines and oversee CI/CD activity.
        <br />
        To get started, add a component and merge its pull request for a build pipeline.
      </EmptyStateBody>
      <EmptyStateActions>
        <ButtonWithAccessTooltip
          component={(props) => (
            <Link
              {...props}
              to={`${IMPORT_PATH.createPath({ workspaceName: namespace })}?application=${applicationName}`}
            />
          )}
          variant="secondary"
          isDisabled={!canCreateComponent}
          tooltip="You don't have access to add components"
          analytics={{
            link_name: 'add-component',
            link_location: 'pipeline-run-empty-state',
            app_name: applicationName,
          }}
        >
          Add component
        </ButtonWithAccessTooltip>
      </EmptyStateActions>
    </AppEmptyState>
  );
};

export default PipelineRunEmptyState;
