import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { ConformaViolationsCard } from './ConformaViolationsCard';
import { IssueDistributionCard } from './IssueDistributionCard';
import IssuesByStatusCard from './IssuesByStatusCard';
import { LatestIssuesCard } from './LatestIssuesCard';

const IssuesOverview: React.FunctionComponent = () => {
  return (
    <Grid
      hasGutter
      style={{
        paddingTop: 'var(--pf-t--global--spacer--lg)',
      }}
    >
      <GridItem span={8}>
        <Grid hasGutter>
          <GridItem>
            <IssueDistributionCard />
          </GridItem>
          <GridItem>
            <IssuesByStatusCard />
          </GridItem>
          <GridItem>
            <ConformaViolationsCard />
          </GridItem>
        </Grid>
      </GridItem>
      <GridItem span={4}>
        <LatestIssuesCard />
      </GridItem>
    </Grid>
  );
};
export default IssuesOverview;
