import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel, PipelineRunType } from '../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../hooks/usePipelineRuns';
import { HttpError } from '../../../k8s/error';
import { PipelineRunGroupVersionKind } from '../../../models';
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

  if (loadErr || (loaded && !commit)) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(loadErr ? (loadErr as { code: number }).code : 404)}
        title={`Could not load ${PipelineRunGroupVersionKind.kind}`}
        body={(loadErr as { message: string })?.message ?? 'Not found'}
      />
    );
  }

  if (!commit) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
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
