import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { HttpError } from '~/k8s/error';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../hooks/usePipelineRuns';
import { ACTIVITY_PATH_LATEST_COMMIT, COMMIT_DETAILS_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import { useApplicationBreadcrumbs } from '../../../utils/breadcrumb-utils';
import { createCommitObjectFromPLR, getCommitShortName } from '../../../utils/commits-utils';
import { runStatus } from '../../../utils/pipeline-utils';
import { DetailsPage } from '../../DetailsPage';
import SidePanelHost from '../../SidePanel/SidePanelHost';
import { StatusIconWithTextLabel } from '../../topology/StatusIcon';
import { useCommitStatus } from '../commit-status';
import { CommitIcon } from '../CommitIcon';

import './CommitDetailsView.scss';

export const COMMITS_GS_LOCAL_STORAGE_KEY = 'commits-getting-started-modal';

const CommitDetailsView: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [pipelineruns, loaded, loadErr] = usePipelineRunsForCommit(
    namespace,
    applicationName,
    commitName,
  );

  const commit = React.useMemo(
    () =>
      loaded &&
      pipelineruns?.length &&
      createCommitObjectFromPLR(
        pipelineruns.find(
          (p) => p.metadata.labels[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
        ),
      ),
    [loaded, pipelineruns],
  );

  const [commitStatus] = useCommitStatus(applicationName, commitName);

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
          <Text component={TextVariants.h2}>
            <span className="pf-v5-u-mr-sm">
              <CommitIcon isPR={commit.isPullRequest} className="commit-details__title-icon" />{' '}
              <b>{commit.shaTitle}</b>
            </span>
            <StatusIconWithTextLabel status={commitStatus as runStatus} />
          </Text>
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
