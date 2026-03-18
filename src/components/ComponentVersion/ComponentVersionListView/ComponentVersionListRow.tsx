import * as React from 'react';
import { Link } from 'react-router-dom';
import { COMPONENT_VERSION_DETAILS_PATH } from '~/routes/paths';
import { TableData } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { RowFunctionArgs } from '~/shared/components/table/VirtualBody';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentBuildPipeline, ComponentVersion } from '~/types/component';
import { getPipelineName } from '~/utils/component-utils';
import { createBranchUrl } from '~/utils/git-utils';
import { versionTableColumnClasses } from './ComponentVersionListHeader';

export type VersionListRowCustomData = {
  repoUrl?: string;
  defaultPipeline?: ComponentBuildPipeline;
  componentName: string;
};

export const ComponentVersionListRow: React.FC<
  RowFunctionArgs<ComponentVersion, VersionListRowCustomData>
> = ({ obj, customData }) => {
  const namespace = useNamespace();
  const { repoUrl, defaultPipeline, componentName } = customData;
  const branchUrl = createBranchUrl(repoUrl, obj.revision);
  const pipelineName = getPipelineName(obj['build-pipeline'], defaultPipeline);

  return (
    <>
      <TableData className={versionTableColumnClasses.name}>
        <Link
          to={COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            componentName,
            versionRevision: obj.revision,
          })}
        >
          {obj.name}
        </Link>
      </TableData>
      <TableData className={versionTableColumnClasses.revision}>
        {branchUrl ? <ExternalLink href={branchUrl} text={obj.revision} /> : obj.revision || '-'}
      </TableData>
      <TableData className={versionTableColumnClasses.pipeline}>{pipelineName}</TableData>
    </>
  );
};
