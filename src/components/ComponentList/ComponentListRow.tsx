import * as React from 'react';
import { Link } from 'react-router-dom';
import { PacStatesForComponents } from '../../hooks/usePACStatesForComponents';
import { COMPONENT_DETAILS_V2_PATH } from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared';
import { ImageUrlDisplay } from '../../shared/components/image-display';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind, PipelineRunKind } from '../../types';
import { getLastestImage } from '../../utils/component-utils';
import GitRepoLink from '../GitLink/GitRepoLink';
import { componentsTableColumnClasses } from './ComponentListHeader';

type ComponentWithLatestBuildPipeline = ComponentKind & {
  latestBuildPipelineRun?: PipelineRunKind;
};

const ComponentsListRow: React.FC<
  RowFunctionArgs<ComponentWithLatestBuildPipeline, PacStatesForComponents>
> = ({ obj: component }) => {
  const namespace = useNamespace();
  const name = component.metadata.name;
  const latestImage = getLastestImage(component);
  const versions = component.spec.source?.versions;
  const versionsCount = versions?.length ?? 0;

  return (
    <>
      <TableData className={componentsTableColumnClasses.component} data-test="component-list-item">
        <Link
          to={COMPONENT_DETAILS_V2_PATH.createPath({
            workspaceName: namespace,
            componentName: name,
          })}
        >
          {name}
        </Link>
      </TableData>
      <TableData className={componentsTableColumnClasses.gitRepository}>
        {component.spec.source?.git && (
          <GitRepoLink
            url={component.spec.source?.git?.url}
            revision={component.spec.source?.git?.revision}
            context={component.spec.source?.git?.context}
          />
        )}
      </TableData>
      <TableData className={componentsTableColumnClasses.imageRegistry}>
        {latestImage && (
          <div>
            <ImageUrlDisplay
              imageUrl={latestImage}
              namespace={component.metadata.namespace}
              componentName={component.metadata.name}
            />
          </div>
        )}
      </TableData>
      <TableData
        className={componentsTableColumnClasses.componentVersions}
        data-test="component-versions-count"
      >
        {versionsCount}
      </TableData>
    </>
  );
};

export default ComponentsListRow;
