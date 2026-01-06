import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { ReleaseModel } from '~/models';
import { getErrorState } from '~/shared/utils/error-utils';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { useAccessReviewForModel } from '~/utils/rbac';
import { useAuth } from '../../auth/useAuth';
import { useRelease } from '../../hooks/useReleases';
import {
  APPLICATION_RELEASE_DETAILS_PATH,
  APPLICATION_RELEASE_LIST_PATH,
} from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { useNamespace } from '../../shared/providers/Namespace';
import { useApplicationBreadcrumbs } from '../Applications/breadcrumb-utils';
import { releaseRerun } from '../../utils/release-actions';
import { DetailsPage } from '../DetailsPage';

const ReleaseDetailsView: React.FC = () => {
  const { applicationName, releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const navigate = useNavigate();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [release, loaded, error] = useRelease(namespace, releaseName);
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');
  const track = useTrackEvent();
  const {
    user: { email },
  } = useAuth();

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'release');
  }

  return (
    <DetailsPage
      headTitle={release.metadata.name}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: APPLICATION_RELEASE_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName,
          }),
          name: 'Releases',
        },
        {
          path: APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            releaseName,
          }),
          name: release.metadata.name,
        },
      ]}
      title={
        <Text component={TextVariants.h2}>
          <b data-test="release-name">{release.metadata.name}</b>
        </Text>
      }
      baseURL={APPLICATION_RELEASE_DETAILS_PATH.createPath({
        workspaceName: namespace,
        applicationName,
        releaseName,
      })}
      actions={[
        {
          onClick: () => {
            track(TrackEvents.ButtonClicked, {
              link_name: 're-run-release',
              link_location: 'release-actions',
              release_name: releaseName,
              app_name: applicationName,
              namespace,
            });
            void releaseRerun(release, email).then(() => {
              navigate(
                APPLICATION_RELEASE_LIST_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                }),
              );
            });
          },
          disabledTooltip: 'You do not have access to re-run release',
          isDisabled: !canCreateRelease,
          key: 're-run-release',
          label: 'Re-run release',
        },
      ]}
      tabs={[
        {
          key: 'index',
          label: 'Overview',
          isFilled: true,
        },
        {
          key: 'pipelineruns',
          label: 'Pipeline runs',
        },
        {
          key: 'artifacts',
          label: 'Release artifacts',
          isFilled: true,
        },
      ]}
    />
  );
};

export default ReleaseDetailsView;
