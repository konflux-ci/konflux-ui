import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button, pluralize, Skeleton } from '@patternfly/react-core';
import { APPLICATION_LIST_PATH } from '@routes/paths';
import { useApplications } from '../../hooks/useApplications';
import { RowFunctionArgs, TableData } from '../../shared';
import { NamespaceKind } from '../../types';
import { namespaceTableColumnClasses } from './NamespaceListHeader';

const NamespaceButton: React.FC<{ namespace: string }> = React.memo(({ namespace }) => (
  <Button
    variant="secondary"
    component={(props) => (
      <Link
        {...props}
        to={APPLICATION_LIST_PATH.createPath({
          workspaceName: namespace,
        })}
        title="Go to this namespace"
      />
    )}
  >
    Go to the namespace
  </Button>
));

const NamespaceListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<NamespaceKind>>> = ({
  obj,
}) => {
  const [applications, loaded] = useApplications(obj.metadata.name);

  return (
    <>
      <TableData className={namespaceTableColumnClasses.name} data-test="app-row-test-id">
        {obj.metadata.name}
      </TableData>
      <TableData className={namespaceTableColumnClasses.applications}>
        {loaded ? (
          pluralize(applications.length, 'Component')
        ) : (
          <Skeleton width="50%" screenreaderText="Loading component count" />
        )}
      </TableData>
      <TableData className={namespaceTableColumnClasses.actions}>
        <NamespaceButton namespace={obj.metadata.name} />
      </TableData>
    </>
  );
};

export default NamespaceListRow;
