import React from 'react';
import { useParams } from 'react-router-dom';
import { ReleasesList } from '~/components/Release/ReleasesList';
import { IfFeature } from '~/feature-flags/hooks';
import { useReleases } from '~/hooks/useReleases';
import { RouterParams } from '~/routes/utils';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { useNamespace } from '~/shared/providers/Namespace';
import { getGroupNameMatchLabels } from '~/utils/release-utils';

export const ComponentGroupReleasesTab: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const {
    data: releases,
    isLoading,
    clusterError,
    archiveError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReleases(namespace, getGroupNameMatchLabels(groupName));

  return (
    <IfFeature flag="component-model">
      <ListLayout title="Releases">
        <ReleasesList
          releases={releases ?? []}
          isLoading={isLoading}
          clusterError={clusterError}
          archiveError={archiveError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </ListLayout>
    </IfFeature>
  );
};

export default ComponentGroupReleasesTab;
