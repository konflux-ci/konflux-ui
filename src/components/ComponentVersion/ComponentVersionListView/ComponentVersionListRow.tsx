import * as React from 'react';
import { Link } from 'react-router-dom';
import { COMPONENT_VERSION_DETAILS_PATH } from '~/routes/paths';
import { TableData } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentBuildPipeline, ComponentVersion } from '~/types/component';
import { createBranchUrl } from '~/utils/git-utils';
import { versionTableColumnClasses } from './ComponentVersionListHeader';

export type VersionListRowCustomData = {
  repoUrl?: string;
  defaultPipeline?: ComponentBuildPipeline;
  componentName: string;
};

const getPipelineName = (
  versionPipeline?: ComponentBuildPipeline,
  defaultPipeline?: ComponentBuildPipeline,
): string => {
  const pipeline = versionPipeline ?? defaultPipeline;
  if (!pipeline) {
    return '-';
  }

  const def = pipeline['pull-and-push'] ?? pipeline.push ?? pipeline.pull;
  if (!def) {
    return '-';
  }

  return def['pipelineref-by-name'] ?? def['pipelinespec-from-bundle']?.name ?? '-';
};

interface ComponentVersionListRowProps {
  obj: ComponentVersion;
  customData: VersionListRowCustomData;
}

export const ComponentVersionListRow: React.FC<ComponentVersionListRowProps> = ({
  obj,
  customData,
}) => {
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
      <TableData className={versionTableColumnClasses.description}>{obj.context || '-'}</TableData>
      <TableData className={versionTableColumnClasses.revision}>
        {branchUrl ? <ExternalLink href={branchUrl} text={obj.revision} /> : obj.revision || '-'}
      </TableData>
      <TableData className={versionTableColumnClasses.pipeline}>{pipelineName}</TableData>
    </>
  );
};
