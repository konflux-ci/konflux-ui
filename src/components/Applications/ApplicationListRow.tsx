import * as React from 'react';
import { Link } from 'react-router-dom';
import { pluralize, Skeleton } from '@patternfly/react-core';
import { useComponents } from '../../hooks/useComponents';
import { APPLICATION_DETAILS_PATH } from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ApplicationKind } from '../../types';
import { useApplicationActions } from './application-actions';
import { applicationTableColumnClasses } from './ApplicationListHeader';

const ApplicationListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<ApplicationKind>>> = ({
  obj,
}) => {
  const namespace = useNamespace();
  const [components, loaded, error] = useComponents(namespace, obj.metadata?.name);
  const actions = useApplicationActions(obj);

  const displayName = obj.spec.displayName || obj.metadata?.name;

  return (
    <>
      <TableData className={applicationTableColumnClasses.name} data-test="app-row-test-id">
        <Link
          to={APPLICATION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: obj.metadata.name,
          })}
          title={displayName}
        >
          {displayName}
        </Link>
      </TableData>
      <TableData className={applicationTableColumnClasses.components}>
        {loaded ? (
          error ? (
            'Failed to load components'
          ) : (
            pluralize(components.length, 'Component')
          )
        ) : (
          <Skeleton width="50%" screenreaderText="Loading component count" />
        )}
      </TableData>
      <TableData className={applicationTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default ApplicationListRow;
