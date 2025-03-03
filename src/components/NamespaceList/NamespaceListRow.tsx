import * as React from 'react';
import { Link, useFetcher } from 'react-router-dom';
import { Button, pluralize, Skeleton } from '@patternfly/react-core';
import { APPLICATION_LIST_PATH } from '@routes/paths';
import { useApplications } from '../../hooks/useApplications';
import { RowFunctionArgs, TableData } from '../../shared';
import { NamespaceKind } from '../../types';
import { namespaceTableColumnClasses } from './NamespaceListHeader';

const NamespaceButton: React.FC<{ namespace: string }> = React.memo(({ namespace }) => {
  const fetcher = useFetcher();
  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const path = APPLICATION_LIST_PATH.createPath({
    workspaceName: namespace,
  });

  const handleMouseEnter = React.useCallback(() => {
    hoverTimeout.current = setTimeout(() => {
      fetcher.load(path);
    }, 500);
  }, [fetcher, path]);

  const handleMouseLeave = React.useCallback(() => {
    // Clear the timer if the user leaves before 500ms.
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  }, []);
  return (
    <Button
      variant="secondary"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      component={(props) => <Link {...props} to={path} title="Go to this namespace" />}
    >
      Go to the namespace
    </Button>
  );
});

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
          pluralize(applications.length, 'Application')
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
