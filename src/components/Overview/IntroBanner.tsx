import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
  Title,
  Text,
  Button,
} from '@patternfly/react-core';
import { NAMESPACE_LIST_PATH } from '../../routes/paths';

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
          <CardBody>
            <Button
              className="intro-banner__cta"
              component={(props) => (
                <Link {...props} to={NAMESPACE_LIST_PATH.createPath({} as never)} />
              )}
              variant="secondary"
              data-test="view-my-applications"
              size="lg"
            >
              View my namespaces
            </Button>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem className="intro-banner__image" span={4} />
    </Grid>
  );
};

export default IntroBanner;
