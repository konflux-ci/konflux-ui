import React from 'react';
import { DetailsPage } from '../DetailsPage';

const Issues: React.FunctionComponent = () => {
  return (
    <DetailsPage
      data-test="issues-data-test"
      title="Issues"
      headTitle="Issues"
      description="Summary of issues in your Konflux content at any given point in time"
      tabs={[
        {
          key: 'index',
          label: 'Overview',
          isFilled: true,
        },
        {
          key: 'issues-list',
          label: 'Issues',
        },
      ]}
    />
  );
};
export default Issues;
