import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useRelease } from '../../hooks/useReleases';
import { HttpError } from '../../k8s/error';
import { RouterParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { DetailsPage } from '../DetailsPage';
import { useWorkspaceInfo } from '../Workspace/workspace-context';

const ReleaseDetailsView: React.FC = () => {
  const { applicationName, releaseName } = useParams<RouterParams>();
  const { namespace, workspace } = useWorkspaceInfo();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [release, loaded, error] = useRelease(namespace, workspace, releaseName);

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

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <DetailsPage
      headTitle={release.metadata.name}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/releases`,
          name: 'Releases',
        },
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/releases/${releaseName}`,
          name: release.metadata.name,
        },
      ]}
      title={
        <Text component={TextVariants.h2}>
          <b data-test="release-name">{release.metadata.name}</b>
        </Text>
      }
      baseURL={`/application-pipeline/workspaces/${workspace}/applications/${applicationName}/releases/${releaseName}`}
      tabs={[
        {
          key: 'index',
          label: 'Overview',
          isFilled: true,
        },
      ]}
    />
  );
};

export default ReleaseDetailsView;
