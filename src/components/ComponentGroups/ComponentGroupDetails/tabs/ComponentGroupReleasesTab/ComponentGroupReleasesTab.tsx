import React from 'react';
import { useParams } from 'react-router-dom';
import { ReleasesPage } from '~/components/Release/ReleasesPage';
import { RouterParams } from '~/routes/utils';
import { getGroupNameMatchLabels } from '~/utils/release-utils';

export const ComponentGroupReleasesTab: React.FC = () => {
  const { groupName } = useParams<RouterParams>();

  return <ReleasesPage selectorMatchLabels={getGroupNameMatchLabels(groupName)} />;
};

export default ComponentGroupReleasesTab;
