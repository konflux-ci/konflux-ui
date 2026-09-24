import * as React from 'react';
import IntegrationTestsListViewByComponentGroup from '~/components/IntegrationTests/IntegrationTestsListView/IntegrationTestsListViewByComponentGroup';
import { IfFeature } from '~/feature-flags/hooks';

export const ComponentGroupIntegrationTestsTab: React.FC = () => {
  return (
    <IfFeature flag="component-model">
      <IntegrationTestsListViewByComponentGroup />
    </IfFeature>
  );
};

export default ComponentGroupIntegrationTestsTab;
