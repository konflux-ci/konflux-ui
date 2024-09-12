import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
// import { ApplicationModel, ComponentModel, IntegrationTestScenarioModel } from '../../models';
import { useApplication } from '../../hooks/useApplications';
import { HttpError } from '../../k8s/error';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
// import { useTrackEvent, TrackEvents } from '../../utils/analytics';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
// import { useAccessReviewForModel } from '../../utils/rbac';
import DetailsPage from '../DetailsPage/DetailsPage';
// import { useModalLauncher } from '../modal/ModalProvider';
// import { applicationDeleteModal } from '../modal/resource-modals';
import { useWorkspaceInfo } from '../Workspace/workspace-context';
import { ApplicationHeader } from './ApplicationHeader';

import './ApplicationDetails.scss';

export const ApplicationDetails: React.FC<React.PropsWithChildren> = () => {
  const { applicationName } = useParams();
  // const track = useTrackEvent();
  const { namespace, workspace } = useWorkspaceInfo();
  // const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');
  // const [canCreateIntegrationTest] = useAccessReviewForModel(
  //   IntegrationTestScenarioModel,
  //   'create',
  // );
  // const [canDeleteApplication] = useAccessReviewForModel(ApplicationModel, 'delete');

  // const navigate = useNavigate();
  // const showModal = useModalLauncher();

  const [application, applicationLoaded, applicationError] = useApplication(
    namespace,
    workspace,
    applicationName,
  );

  const appDisplayName = application?.spec?.displayName || application?.metadata?.name || '';
  const applicationBreadcrumbs = useApplicationBreadcrumbs(appDisplayName, false);

  if (applicationError) {
    const appError = HttpError.fromCode((applicationError as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={appError}
        title={`Unable to load application ${appDisplayName}`}
        body={appError.message}
      />
    );
  }
  const loading = (
    <Bullseye>
      <Spinner data-test="spinner" />
    </Bullseye>
  );

  if (!applicationLoaded) {
    return loading;
  }

  return (
    <React.Fragment>
      <DetailsPage
        data-test="application-details-test-id"
        headTitle={appDisplayName}
        breadcrumbs={applicationBreadcrumbs}
        title={<ApplicationHeader application={application} />}
        baseURL={`/workspaces/${workspace}/applications/${applicationName}`}
        tabs={[
          {
            key: '',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'activity',
            label: 'Activity',
            isFilled: true,
            partial: true,
            className: 'application-details__activity',
          },
          {
            key: 'components',
            label: 'Components',
            isFilled: true,
          },
          {
            key: 'integrationtests',
            label: 'Integration tests',
          },
          {
            key: 'releases',
            label: 'Releases',
          },
        ]}
      />
    </React.Fragment>
  );
};
