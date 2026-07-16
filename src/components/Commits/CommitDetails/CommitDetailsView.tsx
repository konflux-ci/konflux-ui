import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { useCommitStatus } from '~/components/Commits/commit-status';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { DetailsPage } from '~/components/DetailsPage';
import SidePanelHost from '~/components/SidePanel/SidePanelHost';
import { StatusIconWithTextLabel } from '~/components/topology/StatusIcon';
import { PipelineRunType } from '~/consts/pipelinerun';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import { HttpError } from '~/k8s/error';
import { ACTIVITY_PATH_LATEST_COMMIT, COMMIT_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import ErrorEmptyState from '~/shared/components/empty-state/ErrorEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { createCommitObjectFromPLR, getCommitShortName } from '~/utils/commits-utils';

import './CommitDetailsView.scss';

export const COMMITS_GS_LOCAL_STORAGE_KEY = 'commits-getting-started-modal';

const CommitDetailsView: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [pipelineruns, loaded, loadErr] = usePipelineRunsForCommitV2(
    namespace,
    applicationName,
    commitName,
    1,
    undefined,
    PipelineRunType.BUILD,
  );

  const commit = React.useMemo(
    () => loaded && pipelineruns?.length && createCommitObjectFromPLR(pipelineruns[0]),
    [loaded, pipelineruns],
  );

  const [commitStatus, commitLoaded, statusError] = useCommitStatus(applicationName, commitName);
  const faviconStatus = commitLoaded && !statusError ? commitStatus : null;
  useStatusOnFavicon(faviconStatus);

  const commitDisplayName = getCommitShortName(commitName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (loadErr) {
    return getErrorState(loadErr, loaded, 'commit details');
  }

  if (!commit) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(404)}
        title={`Unable to load commit details`}
        body={'Not found'}
      />
    );
  }

  return (
    <SidePanelHost>
      <DetailsPage
        headTitle={`Commit ${commitDisplayName}`}
        breadcrumbs={[
          ...applicationBreadcrumbs,
          {
            path: ACTIVITY_PATH_LATEST_COMMIT.createPath({
              workspaceName: namespace,
              applicationName,
            }),
            name: 'commits',
          },
          {
            path: COMMIT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              commitName,
            }),
            name: commitDisplayName,
          },
        ]}
        title={
          <Content component={ContentVariants.h2}>
            <span className="pf-v6-u-mr-sm">
              <CommitIcon isPR={commit.isPullRequest} className="commit-details__title-icon" />{' '}
              <b>{commit.shaTitle}</b>
            </span>
            <StatusIconWithTextLabel status={commitStatus} />
            <FeatureFlagIndicator flags={['pipelineruns-kubearchive']} />
          </Content>
        }
        actions={[
          {
            key: 'go-to-source',
            label: 'Go to source',
            onClick: () => window.open(commit.shaURL),
          },
        ]}
        baseURL={COMMIT_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          commitName,
        })}
        tabs={[
          {
            key: 'index',
            label: 'Details',
            isFilled: true,
          },
          {
            key: 'pipelineruns',
            label: 'Pipeline runs',
          },
        ]}
      />
    </SidePanelHost>
  );
};

export default CommitDetailsView;
