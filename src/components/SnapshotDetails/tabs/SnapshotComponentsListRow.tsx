import * as React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCopy, Skeleton } from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { COMMIT_DETAILS_PATH, COMPONENT_LIST_PATH } from '~/routes/paths';
import { RowFunctionArgs, TableData } from '~/shared/components/table';
import { useNamespace } from '~/shared/providers/Namespace';
import { ImageRepositoryVisibility } from '~/types';
import { getImageUrlForVisibility } from '~/utils/component-utils';
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
  const [urlInfo, proxyLoaded, proxyError] = useImageProxy();

  // Fetch ImageRepository to get visibility setting
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    obj.name,
    false,
  );

  // Get the appropriate image URL based on visibility
  // When proxy has error or urlInfo is null, fallback to original URL
  const displayImageUrl = getImageUrlForVisibility(
    obj.containerImage,
    imageRepository?.spec?.image?.visibility ?? null,
    proxyError || !urlInfo ? null : urlInfo.hostname,
  );

  const isPrivate = imageRepository?.spec?.image?.visibility === ImageRepositoryVisibility.private;

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
        {(!imageRepoLoaded && !imageRepoError) || (isPrivate && !proxyLoaded && !proxyError) ? (
          <Skeleton aria-label="Loading image URL" />
        ) : (
          <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
            {displayImageUrl}
          </ClipboardCopy>
        )}
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
