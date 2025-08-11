import * as React from 'react';
import { Link } from 'react-router-dom';
import { pluralize, Skeleton } from '@patternfly/react-core';
import { APPLICATION_LIST_PATH } from '@routes/paths';
import { useApplications } from '~/hooks/useApplications';
import { RowFunctionArgs, TableData } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { NamespaceKind } from '~/types';
import { namespaceTableColumnClasses } from './NamespaceListHeader';
import { useNamespaceActions } from './useNamespaceActions';

const NamespaceListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<NamespaceKind>>> = ({
  obj,
}) => {
  const [applications, loaded] = useApplications(obj.metadata.name);
  const [actions, , onToggle] = useNamespaceActions(obj);

  return (
    <>
      <TableData className={namespaceTableColumnClasses.name} data-test="app-row-test-id">
        <Link
          to={APPLICATION_LIST_PATH.createPath({ workspaceName: obj.metadata.name })}
          title="Go to this namespace"
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={namespaceTableColumnClasses.applications}>
        {loaded ? (
          pluralize(applications.length, 'Application')
        ) : (
          <Skeleton width="50%" screenreaderText="Loading application count" />
        )}
      </TableData>
      <TableData className={namespaceTableColumnClasses.kebab}>
        <ActionMenu actions={actions} onOpen={onToggle} />
      </TableData>
    </>
  );
};

export default NamespaceListRow;
