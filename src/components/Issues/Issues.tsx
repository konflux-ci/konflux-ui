import React from 'react';
import { Title } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { DetailsPage } from '../DetailsPage';

const Issues: React.FunctionComponent = () => {
  return (
    <IfFeature flag="issues-dashboard">
      <DetailsPage
        data-test="issues-data-test"
        title={
          <>
            <Title headingLevel="h1" size="2xl">
              Issues <FeatureFlagIndicator flags={['issues-dashboard']} fullLabel />
            </Title>
          </>
        }
        headTitle="Issues"
        description="Summary of issues in your Konflux content at any given point in time"
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'list',
            label: 'Issues',
          },
        ]}
      />
    </IfFeature>
  );
};
export default Issues;
