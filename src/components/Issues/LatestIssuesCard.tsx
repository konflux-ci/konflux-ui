import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  List,
  ListItem,
  Spinner,
  Text,
} from '@patternfly/react-core';
import ArrowRightIcon from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useLatestIssues } from '~/hooks/useIssues';
import { getErrorState } from '~/shared/utils/error-utils';
import { Issue } from '~/types/issues';
import { useNamespace } from '../../shared/providers/Namespace';
import './LatestIssuesCard.scss';

const SEVERITY_ICONS = {
  critical: ExclamationCircleIcon,
  major: ExclamationCircleIcon,
  minor: ExclamationTriangleIcon,
  info: InfoCircleIcon,
} as const;

const getSeverityIcon = (severity: Issue['severity']) => {
  const IconComponent = SEVERITY_ICONS[severity] || InfoCircleIcon;
  return <IconComponent className={`latest-issues-card__icon--${severity}`} />;
};

interface LatestIssuesCardProps {
  className?: string;
}

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const LatestIssuesCard: React.FC<LatestIssuesCardProps> = ({ className }) => {
  const namespace = useNamespace();
  const [data, loaded, error] = useLatestIssues(namespace, 10);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'issues');
  }

  const issues = data?.data || [];
  const hasIssues = issues.length > 0;

  return (
    <Card className={`latest-issues-card ${className || ''}`}>
      <CardHeader>
        <CardTitle component="h3">Latest issues</CardTitle>
      </CardHeader>
      <CardBody>
        {hasIssues ? (
          <>
            <List isPlain className="latest-issues-card__list">
              {issues.map((issue) => (
                <ListItem key={issue.id} className="latest-issues-card__item">
                  <div className="latest-issues-card__item-content">
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      gap={{ default: 'gapSm' }}
                      className="latest-issues-card__title-row"
                    >
                      <FlexItem className="latest-issues-card__icon-container">
                        {getSeverityIcon(issue.severity)}
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <div className="latest-issues-card__title">{issue.title}</div>
                      </FlexItem>
                    </Flex>
                    <div className="latest-issues-card__description">{issue.description}</div>
                    <div className="latest-issues-card__timestamp">
                      {formatTimestamp(issue.detectedAt)}
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
            <div className="latest-issues-card__footer">
              <Button
                variant="link"
                isInline
                component={(props) => <Link {...props} to="/issues?state=ACTIVE" />}
              >
                View all issues <ArrowRightIcon />
              </Button>
            </div>
          </>
        ) : (
          <Text className="latest-issues-card__empty">No issues found.</Text>
        )}
      </CardBody>
    </Card>
  );
};
