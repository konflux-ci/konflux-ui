import * as React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCopy } from '@patternfly/react-core';
import { COMPONENT_LIST_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import GitRepoLink from '../../GitLink/GitRepoLink';
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
          to={COMPONENT_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName: obj.application,
          })}
        >
          {obj.name}
        </Link>
      </TableData>
      <TableData className={commitsTableColumnClasses.image}>
        <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
          {obj.containerImage}
        </ClipboardCopy>
      </TableData>
      {obj.source?.git && (
        <TableData className={commitsTableColumnClasses.url}>
          <GitRepoLink dataTestID="snapshot-component-git-url" url={obj.source?.git?.url} />
        </TableData>
      )}
      <TableData className={commitsTableColumnClasses.revision}>
        {obj.source?.git?.revision ? (
          <Link
            to={`/workspaces/${namespace}/applications/${obj.application}/commit/${obj.source?.git?.revision}`}
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
