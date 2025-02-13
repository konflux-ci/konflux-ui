import * as React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCopy } from '@patternfly/react-core';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import GitRepoLink from '../../GitLink/GitRepoLink';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
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
  const { workspace } = useWorkspaceInfo();
  return (
    <>
      <TableData data-test="snapshot-component-list-row" className={commitsTableColumnClasses.name}>
        <Link to={`/workspaces/${workspace}/applications/${obj.application}/components/`}>
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
            to={`/workspaces/${workspace}/applications/${obj.application}/commit/${obj.source?.git?.revision}`}
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
