import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { APPLICATION_DETAILS_PATH } from '~/routes/paths';
import { LoadingSkeleton } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import './ConformaViolationsCard.scss';
import { useWorkspaceConformaViolations } from './useWorkspaceConformaViolations';

const ConformaViolationsCard: React.FC = () => {
  const namespace = useNamespace();
  const { applications, totalViolations, totalWarnings, loaded, error } =
    useWorkspaceConformaViolations();

  const summaryText = React.useMemo(() => {
    if (totalViolations === 0 && totalWarnings === 0) return null;
    const parts: string[] = [];
    if (totalViolations > 0) {
      parts.push(`${totalViolations} violation${totalViolations !== 1 ? 's' : ''}`);
    }
    if (totalWarnings > 0) {
      parts.push(`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`);
    }
    const appCount = applications.length;
    return `${parts.join(', ')} across ${appCount} application${appCount !== 1 ? 's' : ''}`;
  }, [totalViolations, totalWarnings, applications.length]);

  return (
    <Card data-test="conforma-violations-card">
      <CardTitle>
        <Flex gap={{ default: 'gapSm' }}>
          <FlexItem>Conforma Policy Violations</FlexItem>
          <FlexItem>
            <FeatureFlagIndicator flags={['conforma-policy']} />
          </FlexItem>
        </Flex>
      </CardTitle>
      <CardBody>
        {error ? (
          getErrorState(error, loaded, 'conforma violations', true)
        ) : !loaded ? (
          <LoadingSkeleton count={3} widths="100%" height="16px" />
        ) : totalViolations === 0 && totalWarnings === 0 ? (
          <HelperText>
            <HelperTextItem>
              <span className="conforma-violations-card__success-icon">
                <CheckCircleIcon />
              </span>{' '}
              No conforma violations
            </HelperTextItem>
          </HelperText>
        ) : (
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <TextContent>
                <Text component={TextVariants.p}>
                  <span className="conforma-violations-card__violation-icon">
                    <ExclamationTriangleIcon />
                  </span>{' '}
                  {summaryText}
                </Text>
              </TextContent>
            </FlexItem>
            <FlexItem>
              <div
                className="conforma-violations-card__app-list"
                tabIndex={0}
                data-test="conforma-violations-app-list"
              >
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                  {applications.map((app) => (
                    <FlexItem
                      key={app.applicationName}
                      data-test={`app-row-${app.applicationName}`}
                    >
                      <Flex gap={{ default: 'gapSm' }}>
                        <FlexItem grow={{ default: 'grow' }}>
                          <TextContent>
                            <Text component={TextVariants.small}>
                              <strong>{app.applicationName}</strong>
                              {' — '}
                              {app.violationCount > 0 && (
                                <span className="conforma-violations-card__violation-count">
                                  {app.violationCount} violation
                                  {app.violationCount !== 1 ? 's' : ''}
                                </span>
                              )}
                              {app.violationCount > 0 && app.warningCount > 0 && ', '}
                              {app.warningCount > 0 && (
                                <span className="conforma-violations-card__warning-count">
                                  {app.warningCount} warning
                                  {app.warningCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </Text>
                          </TextContent>
                        </FlexItem>
                        <FlexItem>
                          <Link
                            to={`${APPLICATION_DETAILS_PATH.createPath({ workspaceName: namespace, applicationName: app.applicationName })}/conforma-results`}
                            data-test={`policy-link-${app.applicationName}`}
                          >
                            View policy <ArrowRightIcon />
                          </Link>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  ))}
                </Flex>
              </div>
            </FlexItem>
          </Flex>
        )}
      </CardBody>
    </Card>
  );
};

export default ConformaViolationsCard;
