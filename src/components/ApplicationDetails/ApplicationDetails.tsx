import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { useApplication } from '../../hooks/useApplications';
import { HttpError } from '../../k8s/error';
import { ApplicationModel, ComponentModel, IntegrationTestScenarioModel } from '../../models';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_LIST_PATH,
  INTEGRATION_TEST_ADD_PATH,
  IMPORT_PATH,
} from '../../routes/paths';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { TrackEvents, useTrackEvent } from '../../utils/analytics';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useComponentRelationAction } from '../ComponentRelation/useComponentRelationAction';
import { createCustomizeAllPipelinesModalLauncher } from '../CustomizedPipeline/CustomizePipelinesModal';
import DetailsPage from '../DetailsPage/DetailsPage';
import { useModalLauncher } from '../modal/ModalProvider';
import { applicationDeleteModal } from '../modal/resource-modals';
import { ApplicationHeader } from './ApplicationHeader';

import './ApplicationDetails.scss';

export const ApplicationDetails: React.FC<React.PropsWithChildren> = () => {
  const { applicationName } = useParams();
  // const track = useTrackEvent();
  const namespace = useNamespace();
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canCreateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'create',
  );
  const [canDeleteApplication] = useAccessReviewForModel(ApplicationModel, 'delete');
  const defineComponentRelationAction = useComponentRelationAction(applicationName);

  const navigate = useNavigate();
  const showModal = useModalLauncher();

  const [application, applicationLoaded, applicationError] = useApplication(
    namespace,
    applicationName,
  );
  const track = useTrackEvent();
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

  if (!applicationLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return (
    <React.Fragment>
      <DetailsPage
        data-test="application-details-test-id"
        headTitle={appDisplayName}
        breadcrumbs={applicationBreadcrumbs}
        title={<ApplicationHeader application={application} />}
        baseURL={APPLICATION_DETAILS_PATH.createPath({ workspaceName: namespace, applicationName })}
        actions={[
          {
            onClick: () => {
              track(TrackEvents.ButtonClicked, {
                link_name: 'manage-build-pipelines',
                link_location: 'application-actions',
                app_name: applicationName,
              });
              showModal(createCustomizeAllPipelinesModalLauncher(applicationName, namespace));
            },
            disabledTooltip: 'You do not have access to manage build pipelines',
            isDisabled: !canPatchComponent,
            key: 'manage-build-pipelines',
            label: 'Manage build pipelines',
          },
          {
            key: 'add-component',
            label: 'Add component',
            component: (
              <Link
                to={`${IMPORT_PATH.createPath({ workspaceName: namespace })}?application=${applicationName}`}
                onClick={() => {
                  track(TrackEvents.ButtonClicked, {
                    link_name: 'add-component',
                    link_location: 'application-details-actions',
                    app_name: applicationName,
                  });
                }}
              >
                Add component
              </Link>
            ),
            isDisabled: !canCreateComponent,
            disabledTooltip: "You don't have access to add a component",
          },
          {
            key: 'add-integration-test',
            label: 'Add integration test',
            component: (
              <Link
                to={INTEGRATION_TEST_ADD_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                })}
                onClick={() => {
                  track(TrackEvents.ButtonClicked, {
                    link_name: 'add-integration-test',
                    link_location: 'application-details-actions',
                    app_name: applicationName,
                  });
                }}
              >
                Add integration test
              </Link>
            ),
            isDisabled: !canCreateIntegrationTest,
            disabledTooltip: "You don't have access to add an integration test",
          },
          defineComponentRelationAction(),
          {
            type: 'separator',
            key: 'delete-separator',
            label: '',
          },
          {
            key: 'delete-application',
            label: 'Delete application',
            onClick: () =>
              showModal<{ submitClicked: boolean }>(
                applicationDeleteModal(application),
              ).closed.then(({ submitClicked }) => {
                if (submitClicked)
                  navigate(APPLICATION_LIST_PATH.createPath({ workspaceName: namespace }));
              }),
            isDisabled: !canDeleteApplication,
            disabledTooltip: "You don't have access to delete this application",
          },
        ]}
        tabs={[
          {
            key: 'index',
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
            key: 'snapshots',
            label: 'Snapshots',
            isFilled: true,
          },
          {
            key: 'releases',
            label: 'Releases',
            isFilled: true,
          },
        ]}
      />
    </React.Fragment>
  );
};
