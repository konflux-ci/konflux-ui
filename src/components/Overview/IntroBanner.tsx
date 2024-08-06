import * as React from 'react';
import { Card, CardTitle, CardBody, Grid, GridItem, Title, Text } from '@patternfly/react-core';

import './IntroBanner.scss';

const IntroBanner: React.FC = () => {
  return (
    <Grid className="intro-banner">
      <GridItem span={8}>
        <Card className="intro-banner__content" isLarge>
          <CardTitle>
            <Title headingLevel="h1" size="2xl">
              Get started with Konflux
            </Title>
          </CardTitle>
          <CardBody>
            <Text>
              Konflux makes it easy to securely build, test and release your software projects to a
              wide variety of targets.
            </Text>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem className="intro-banner__image" span={4} />
    </Grid>
  );
};

export default IntroBanner;
