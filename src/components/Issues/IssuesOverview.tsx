import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { ConformaViolationsCard } from '~/components/Issues/ConformaViolationsCard';
import { IfFeature } from '~/feature-flags/hooks';
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
        </Grid>
      </GridItem>
      <GridItem span={4}>
        <LatestIssuesCard />
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
