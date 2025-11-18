import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { IssueDistributionCard } from './IssueDistributionCard';
import IssuesByStatusCard from './IssuesByStatusCard';

const IssuesOverview: React.FunctionComponent = () => {
  return (
    <Grid
      hasGutter
      style={{
        paddingTop: 'var(--pf-v5-global--spacer--lg)',
      }}
    >
      <GridItem span={12}>{/* Konflux health component  */}</GridItem>
      <GridItem span={8}>
        <IssueDistributionCard />
      </GridItem>
      <GridItem span={4} rowSpan={2}>
        {/* Last issues component */}
      </GridItem>
      <GridItem span={8}>
        <IssuesByStatusCard />
      </GridItem>
    </Grid>
  );
};
export default IssuesOverview;
