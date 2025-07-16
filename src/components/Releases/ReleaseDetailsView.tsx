import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useRelease } from '../../hooks/useReleases';
import { HttpError } from '../../k8s/error';
import {
  APPLICATION_RELEASE_DETAILS_PATH,
  APPLICATION_RELEASE_LIST_PATH,
} from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
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
    const httpError = HttpError.fromCode((error as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load release ${releaseName}`}
        body={(error as { message: string }).message}
      />
    );
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
