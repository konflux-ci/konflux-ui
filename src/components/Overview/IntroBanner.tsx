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
  Alert,
} from '@patternfly/react-core';
import { useApplications } from '../../hooks/useApplications';
import { ApplicationModel, ComponentModel } from '../../models';
import { APPLICATION_LIST_PATH, IMPORT_PATH } from '../../routes/paths';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { useNamespace } from '../../shared/providers/Namespace';
import { AccessReviewResources } from '../../types';
import { useAccessReviewForModels } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { SignupStatus } from '../SignUp/signup-utils';
import SignupButton from '../SignUp/SignupButton';
import { useSignupStatus } from '../SignUp/useSignupStatus';

import './IntroBanner.scss';

const accessReviewResources: AccessReviewResources = [
  { model: ApplicationModel, verb: 'create' },
  { model: ComponentModel, verb: 'create' },
];

const IntroBanner: React.FC = () => {
  const namespace = useNamespace();
  const [canCreate] = useAccessReviewForModels(accessReviewResources);

  const signupStatus = useSignupStatus();

  const [applications, applicationsLoaded] = useApplications(
    signupStatus === SignupStatus.SignedUp && namespace ? namespace : null,
  );
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
            {signupStatus === SignupStatus.SignedUp && (
              <>
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
              </>
            )}
            {signupStatus === SignupStatus.PendingApproval && (
              <Alert
                variant="info"
                isInline
                title="We have received your request. While you are waiting, please join our Slack channel."
              >
                <p>
                  We are working hard to get you early access. After we approve your request, we
                  will send you an email notification with information about how you can access and
                  start using the service.
                </p>
                <p>
                  Join the internal Red Hat Slack workspace here:{' '}
                  <ExternalLink href="https://redhat-internal.slack.com/" hideIcon>
                    https://redhat-internal.slack.com/
                  </ExternalLink>
                  , and then join our{' '}
                  <ExternalLink href="https://app.slack.com/client/E030G10V24F/C04PZ7H0VA8">
                    #konflux-users
                  </ExternalLink>{' '}
                  channel.
                </p>
              </Alert>
            )}
            {signupStatus === SignupStatus.NotSignedUp && <SignupButton />}
          </CardBody>
        </Card>
      </GridItem>
      <GridItem className="intro-banner__image" span={4} />
    </Grid>
  );
};

export default IntroBanner;
