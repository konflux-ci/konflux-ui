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
import { useApplications } from '../../hooks/useApplications';
import { ApplicationModel, ComponentModel } from '../../models';
import { APPLICATION_LIST_PATH, IMPORT_PATH } from '../../routes/paths';
import { useNamespace } from '../../shared/providers/Namespace';
import { AccessReviewResources } from '../../types';
import { useAccessReviewForModels } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';

import './IntroBanner.scss';

const accessReviewResources: AccessReviewResources = [
  { model: ApplicationModel, verb: 'create' },
  { model: ComponentModel, verb: 'create' },
];

const IntroBanner: React.FC = () => {
  const namespace = useNamespace();
  const [canCreate] = useAccessReviewForModels(accessReviewResources);

  const [applications, applicationsLoaded] = useApplications(namespace ? namespace : null);
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
            <ButtonWithAccessTooltip
              className="intro-banner__cta"
              component={(props) => (
                <Link {...props} to={IMPORT_PATH.createPath({ workspaceName: namespace })} />
              )}
              variant="primary"
              data-test="create-application"
              isDisabled={!canCreate}
              tooltip="You don't have access to create an application"
              size="lg"
              analytics={{
                link_name: 'create-application',
              }}
            >
              Create application
            </ButtonWithAccessTooltip>
            {applicationsLoaded && applications?.length > 0 ? (
              <Button
                className="intro-banner__cta"
                component={(props) => (
                  <Link
                    {...props}
                    to={APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })}
                  />
                )}
                variant="secondary"
                data-test="view-my-applications"
                size="lg"
              >
                View my applications
              </Button>
            ) : undefined}
          </CardBody>
        </Card>
      </GridItem>
      <GridItem className="intro-banner__image" span={4} />
    </Grid>
  );
};

export default IntroBanner;
