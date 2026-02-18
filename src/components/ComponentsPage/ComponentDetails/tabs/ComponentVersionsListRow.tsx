import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { ComponentVersionRow } from '~/hooks/useComponentVersions';
import { COMPONENT_VERSION_DETAILS_PATH, PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { RowFunctionArgs, TableData } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { ActionMenuVariant } from '~/shared/components/action-menu/types';
import { ComponentKind } from '~/types';
import { componentVersionsListColumnClasses } from './ComponentVersionsListHeader';

export type ComponentVersionsListRowCustomData = {
  component: ComponentKind | null;
  applicationName?: string;
  namespace: string;
  componentName: string;
};

const ComponentVersionsListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<ComponentVersionRow, ComponentVersionsListRowCustomData>>
> = ({ obj, customData }) => {
  const { componentName } = useParams<RouterParams>();
  const namespace = customData?.namespace ?? '';
  const applicationName = customData?.applicationName;
  const component = customData?.component;
  const gitUrl = component?.spec?.source?.url ?? component?.spec?.source?.git?.url ?? '';

  const actions = React.useMemo(
    () => [
      {
        id: 'view-version',
        label: 'View version',
        cta: {
          href: COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            componentName: componentName ?? '',
            versionName: obj.name,
          }),
        },
      },
    ],
    [namespace, componentName, obj.name],
  );

  const pipelineRunLink =
    obj.pipelineRunName && applicationName
      ? PIPELINE_RUNS_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          pipelineRunName: obj.pipelineRunName,
        })
      : null;

  return (
    <>
      <TableData
        className={componentVersionsListColumnClasses.name}
        data-test={`version-name-${obj.name}`}
      >
        <Link
          to={COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            componentName: componentName ?? '',
            versionName: obj.name,
          })}
        >
          {obj.name}
        </Link>
      </TableData>
      <TableData className={componentVersionsListColumnClasses.description}>
        {obj.description || '-'}
      </TableData>
      <TableData className={componentVersionsListColumnClasses.gitBranchOrTag}>
        {gitUrl ? (
          <GitRepoLink
            url={gitUrl}
            revision={obj.name}
            dataTestID={`version-git-link-${obj.name}`}
          />
        ) : (
          obj.name
        )}
      </TableData>
      <TableData className={componentVersionsListColumnClasses.pipeline}>
        {obj.pipelineName ? (
          pipelineRunLink ? (
            <Link to={pipelineRunLink}>{obj.pipelineName}</Link>
          ) : (
            obj.pipelineName
          )
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={componentVersionsListColumnClasses.actions}>
        <ActionMenu actions={actions} variant={ActionMenuVariant.KEBAB} />
      </TableData>
    </>
  );
};

export default ComponentVersionsListRow;
