import * as React from 'react';
import { Link } from 'react-router-dom';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import SnapshotComponentImage from '~/components/SnapshotDetails/tabs/SnapshotComponentImage';
import { COMMIT_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '~/routes/paths';
import { RowFunctionArgs, TableData } from '~/shared/components/table';
import { useNamespace } from '~/shared/providers/Namespace';
import { commitsTableColumnClasses } from './SnapshotComponentsListHeader';

export type SnapshotComponentTableData = {
  metadata: { uid: string; name: string };
  name: string;
  containerImage: string;
  application: string;
  source?: { git?: { url: string; revision: string } };
};

const SnapshotComponentsListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<SnapshotComponentTableData>>
> = ({ obj }) => {
  const namespace = useNamespace();
  return (
    <>
      <TableData data-test="snapshot-component-list-row" className={commitsTableColumnClasses.name}>
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: obj.application,
            componentName: obj.name,
          })}
        >
          {obj.name}
        </Link>
      </TableData>
      <TableData className={commitsTableColumnClasses.image}>
        <SnapshotComponentImage {...obj} />
      </TableData>
      {obj.source?.git && (
        <TableData className={commitsTableColumnClasses.url}>
          <GitRepoLink dataTestID="snapshot-component-git-url" url={obj.source?.git?.url} />
        </TableData>
      )}
      <TableData className={commitsTableColumnClasses.revision}>
        {obj.source?.git?.revision ? (
          <Link
            to={COMMIT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: obj.application,
              commitName: obj.source?.git?.revision,
            })}
            data-test="snapshot-component-revision"
          >
            {obj.source?.git?.revision}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
    </>
  );
};

export default SnapshotComponentsListRow;
