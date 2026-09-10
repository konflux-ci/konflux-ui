import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import IntegrationTestsListViewV2 from '../../../IntegrationTests/IntegrationTestsListView/IntegrationTestsListViewV2';

export const ComponentGroupIntegrationTestsTab: React.FC = () => {
  return (
    <IfFeature flag="component-model">
      <IntegrationTestsListViewV2 />
    </IfFeature>
  );
};

export default ComponentGroupIntegrationTestsTab;
