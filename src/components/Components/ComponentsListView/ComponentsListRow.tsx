import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, Flex, FlexItem, Skeleton } from '@patternfly/react-core';
import { PacStatesForComponents } from '../../../hooks/usePACStatesForComponents';
import { COMPONENT_DETAILS_PATH, COMMIT_DETAILS_PATH } from '../../../routes/paths';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind, PipelineRunKind } from '../../../types';
import { getCommitsFromPLRs } from '../../../utils/commits-utils';
import { getLastestImage } from '../../../utils/component-utils';
import CommitLabel from '../../Commits/commit-label/CommitLabel';
import { ComponentRelationStatusIcon } from '../../ComponentRelation/details-page/ComponentRelationStatusIcon';
import GitRepoLink from '../../GitLink/GitRepoLink';
import { useBuildLogViewerModal } from '../../LogViewer/BuildLogViewer';
import PipelineRunStatus from '../../PipelineRun/PipelineRunStatus';
import { useComponentActions } from '../component-actions';
import { componentsTableColumnClasses } from './ComponentsListHeader';

type ComponentWithLatestBuildPipeline = ComponentKind & {
  latestBuildPipelineRun?: PipelineRunKind;
};

export const getContainerImageLink = (url: string) => {
  const imageUrl = url.includes('@sha') ? url.split('@sha')[0] : url;
  return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
};

const ComponentsListRow: React.FC<
  RowFunctionArgs<ComponentWithLatestBuildPipeline, PacStatesForComponents>
> = ({ obj: component, customData }) => {
  const namespace = useNamespace();
  const applicationName = component.spec.application;
  const name = component.metadata.name;
  const actions = useComponentActions(component, name);
  const buildLogsModal = useBuildLogViewerModal(component);
  const latestImage = getLastestImage(component);

  const commit = React.useMemo(
    () =>
      ((component.latestBuildPipelineRun &&
        getCommitsFromPLRs([component.latestBuildPipelineRun], 1)) ||
        [])[0],
    [component.latestBuildPipelineRun],
  );

  return (
    <>
      <TableData className={componentsTableColumnClasses.component} data-test="component-list-item">
        <Flex direction={{ default: 'column' }}>
          <FlexItem data-test="component-list-item-name" style={{ minWidth: '30%' }}>
            <Link
              to={COMPONENT_DETAILS_PATH.createPath({
                workspaceName: namespace,
                applicationName,
                componentName: name,
              })}
            >
              <b>{name}</b>{' '}
              <ComponentRelationStatusIcon
                component={component}
                style={{ height: '10px', maxWidth: '25px' }}
              />
            </Link>
          </FlexItem>
          {component.spec.source?.git && (
            <FlexItem>
              <GitRepoLink
                url={component.spec.source?.git?.url}
                revision={component.spec.source?.git?.revision}
                context={component.spec.source?.git?.context}
              />
            </FlexItem>
          )}
          {latestImage && (
            <FlexItem>
              <ExternalLink
                /** by default patternfly button disable text selection on Button component
                    this enables it on <a /> tag */
                style={{ userSelect: 'auto' }}
                href={getContainerImageLink(latestImage)}
                text={latestImage}
              />
            </FlexItem>
          )}
        </Flex>
      </TableData>
      <TableData className={componentsTableColumnClasses.latestBuild}>
        <div className="component-list-view__build-completion">
          {component.latestBuildPipelineRun || customData.pipelineRunsLoaded ? (
            <PipelineRunStatus pipelineRun={component.latestBuildPipelineRun} />
          ) : (
            <Skeleton />
          )}
          <div>
            {commit ? (
              <>
                <Link
                  to={COMMIT_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: commit.application,
                    commitName: commit.sha,
                  })}
                >
                  {commit.isPullRequest ? `#${commit.pullRequestNumber}` : ''} {commit.shaTitle}
                </Link>
                {commit.shaURL && (
                  <>
                    {' '}
                    <CommitLabel
                      gitProvider={commit.gitProvider}
                      sha={commit.sha}
                      shaURL={commit.shaURL}
                    />
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </TableData>
      <TableData className={componentsTableColumnClasses.kebab}>
        <div className="component-list-view__row-actions">
          <Button
            onClick={buildLogsModal}
            variant="link"
            data-test={`view-build-logs-${component.metadata.name}`}
            isInline
          >
            View build logs
          </Button>
          <ActionMenu actions={actions} />
        </div>
      </TableData>
    </>
  );
};

export default ComponentsListRow;
