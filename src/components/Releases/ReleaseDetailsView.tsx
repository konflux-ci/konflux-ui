import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { getErrorState } from '~/shared/utils/error-utils';
import { useRelease } from '../../hooks/useReleases';
import {
  APPLICATION_RELEASE_DETAILS_PATH,
  APPLICATION_RELEASE_LIST_PATH,
} from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { useNamespace } from '../../shared/providers/Namespace';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { DetailsPage } from '../DetailsPage';

const ReleaseDetailsView: React.FC = () => {
  const { applicationName, releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [release, loaded, error] = useRelease(namespace, releaseName);

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
