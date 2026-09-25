import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import IntegrationTestsListViewByComponentGroup from './IntegrationTestsListViewByComponentGroup';

export const ComponentGroupIntegrationTestsTab: React.FC = () => {
  return (
    <IfFeature flag="component-model">
      <IntegrationTestsListViewByComponentGroup />
    </IfFeature>
  );
};

export default ComponentGroupIntegrationTestsTab;
