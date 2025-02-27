import * as React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@patternfly/react-styles';
import { useReleaseStatus } from '../../hooks/useReleaseStatus';
import { APPLICATION_RELEASE_DETAILS_PATH } from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { ReleaseKind } from '../../types';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';
import { releasesTableColumnClasses } from './ReleasesListHeader';

const ReleasesListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<ReleaseKind, { applicationName: string }>>
> = ({ obj, customData: { applicationName } }) => {
  const namespace = useNamespace();
  const status = useReleaseStatus(obj);

  return (
    <>
      <TableData className={releasesTableColumnClasses.name}>
        <Link
          to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            releaseName: obj.metadata.name,
          })}
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={releasesTableColumnClasses.created}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={releasesTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="release-status" status={status} />
      </TableData>
      <TableData className={releasesTableColumnClasses.releasePlan}>
        {obj.spec.releasePlan}
      </TableData>
      <TableData className={releasesTableColumnClasses.releaseSnapshot}>
        <Link
          to={`/workspaces/${namespace}/applications/${applicationName}/snapshots/${obj.spec.snapshot}`}
        >
          {obj.spec.snapshot}
        </Link>
      </TableData>
      <TableData className={css(releasesTableColumnClasses.kebab, 'm-no-actions')}> </TableData>
    </>
  );
};

export default ReleasesListRow;
