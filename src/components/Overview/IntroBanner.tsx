import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Bullseye,
  Title,
  Text,
  Button,
} from '@patternfly/react-core';
import OverviewBannerSvg from '../../assets/overview/overview-banner.svg';
import { IfFeature } from '../../feature-flags/hooks';
import { NAMESPACE_LIST_PATH, RELEASE_MONITOR_PATH } from '../../routes/paths';

import './IntroBanner.scss';

const IntroBanner: React.FC = () => {
  return (
    <Flex
      className="intro-banner"
      direction={{ default: 'row' }}
      alignItems={{ default: 'alignItemsStretch' }}
    >
      <FlexItem flex={{ default: 'flex_2' }}>
        <Card className="intro-banner__content" isLarge isFullHeight>
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
            <IfFeature flag="release-monitor">
              <Button
                className="intro-banner__cta"
                component={(props) => (
                  <Link {...props} to={RELEASE_MONITOR_PATH.createPath({} as never)} />
                )}
                variant="secondary"
                size="lg"
              >
                Release Monitor Board
              </Button>
            </IfFeature>
          </CardBody>
        </Card>
      </FlexItem>
      <FlexItem flex={{ default: 'flex_1' }}>
        <Bullseye className="intro-banner__image">
          <OverviewBannerSvg />
        </Bullseye>
      </FlexItem>
    </Flex>
  );
};

export default IntroBanner;
