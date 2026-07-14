import React from 'react';
import { Title } from '@patternfly/react-core';
import { DetailsPage } from '../DetailsPage';

const Issues: React.FunctionComponent = () => {
  return (
      <DetailsPage
        data-test="issues-data-test"
        title={
          <>
            <Title headingLevel="h1" size="2xl">
              Issues
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
  );
};
export default Issues;
