import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
} from '@patternfly/react-core';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { ElementModel, GraphElement } from '@patternfly/react-topology';
import { useNamespace } from '~/shared/providers/Namespace';
import { COMPONENT_DETAILS_PATH } from '../../../../routes/paths';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { Timestamp } from '../../../../shared/components/timestamp/Timestamp';
import { Commit } from '../../../../types';
import { createRepoBranchURL, createRepoPullRequestURL } from '../../../../utils/commits-utils';
import { StatusIconWithTextLabel } from '../../../topology/StatusIcon';
import CommitLabel from '../../commit-label/CommitLabel';
import { CommitIcon } from '../../CommitIcon';
import { CommitWorkflowNodeModelData } from '../visualization/commit-visualization-types';

export interface CommitSidePanelBodyProps {
  onClose: () => void;
  workflowNode: GraphElement<ElementModel, CommitWorkflowNodeModelData>;
}

const CommitSidePanel: React.FC<React.PropsWithChildren<CommitSidePanelBodyProps>> = ({
  workflowNode,
  onClose,
}) => {
  const namespace = useNamespace();
  const workflowData = workflowNode.getData();
  const commit = workflowData.resource as Commit;

  if (!commit) {
    return null;
  }

  return (
    <>
      <DrawerHead data-test="commit-side-panel-head">
        <span className="commit-side-panel__head-title">
          <CommitIcon isPR={commit.isPullRequest} className="commit-details__title-icon" />{' '}
          {commit.shaTitle}
          <StatusIconWithTextLabel status={workflowNode.getData().status} />
        </span>
        <span className="pf-v5-u-mt-xs commit-side-panel__subtext">
          <GithubIcon /> Source code
        </span>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody data-test="commit-side-panel-body">
        <DescriptionList columnModifier={{ default: '2Col' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Commit ID</DescriptionListTerm>
            <DescriptionListDescription>
              <CommitLabel
                gitProvider={commit.gitProvider}
                sha={commit.sha}
                shaURL={commit.shaURL}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            {commit.isPullRequest ? (
              <>
                <DescriptionListTerm>Pull request</DescriptionListTerm>
                <DescriptionListDescription>
                  {createRepoPullRequestURL(commit) ? (
                    <ExternalLink
                      href={createRepoPullRequestURL(commit)}
                      text={`${commit.pullRequestNumber}`}
                    />
                  ) : (
                    commit.pullRequestNumber
                  )}
                </DescriptionListDescription>
              </>
            ) : null}
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created at</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp timestamp={commit.creationTime} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>By</DescriptionListTerm>
            <DescriptionListDescription>{commit.user}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Component</DescriptionListTerm>
            <DescriptionListDescription>
              {commit.components.map((component, index) => {
                return (
                  <React.Fragment key={component}>
                    <Link
                      to={COMPONENT_DETAILS_PATH.createPath({
                        workspaceName: namespace,
                        applicationName: workflowData.application,
                        componentName: component,
                      })}
                    >
                      {component}
                    </Link>
                    {index < commit.components.length - 1 && ','}
                  </React.Fragment>
                );
              })}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Branch</DescriptionListTerm>
            <DescriptionListDescription>
              {createRepoBranchURL(commit) ? (
                <ExternalLink href={createRepoBranchURL(commit)} text={`${commit.branch}`} />
              ) : (
                `${commit.branch}`
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </DrawerPanelBody>
    </>
  );
};

export default CommitSidePanel;
