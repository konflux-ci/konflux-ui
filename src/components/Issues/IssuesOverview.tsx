import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { IfFeature } from '~/feature-flags/hooks';
import ConformaViolationsCard from './ConformaViolationsCard';
import { IssueDistributionCard } from './IssueDistributionCard';
import IssuesByStatusCard from './IssuesByStatusCard';
import { LatestIssuesCard } from './LatestIssuesCard';

const IssuesOverview: React.FunctionComponent = () => {
  return (
    <Grid
      hasGutter
      style={{
        paddingTop: 'var(--pf-v5-global--spacer--lg)',
      }}
    >
      <GridItem span={8}>
        <IssueDistributionCard />
      </GridItem>
      <GridItem span={4} rowSpan={2}>
        <LatestIssuesCard />
      </GridItem>
      <GridItem span={8}>
        <IssuesByStatusCard />
      </GridItem>
      <IfFeature flag="conforma-policy">
        <GridItem span={8}>
          <ConformaViolationsCard />
        </GridItem>
      </IfFeature>
    </Grid>
  );
};
export default IssuesOverview;
