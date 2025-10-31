import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyStateBody,
  Flex,
  FlexItem,
  List,
  ListItem,
  Spinner,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-right-icon';
import {
  CriticalIcon,
  HighIcon,
  MediumIcon,
  LowIcon,
  UnknownIcon,
} from '~/components/PipelineRun/ScanDetailStatus';
import { Issue, IssueState, IssueSeverity } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';
import EmptySearchImgUrl from '~/shared/assets/Not-found.svg';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import { dateTimeFormatter, isValid } from '~/shared/components/timestamp/datetime';
import { getErrorState } from '~/shared/utils/error-utils';
import { useNamespace } from '../../shared/providers/Namespace';
import './LatestIssuesCard.scss';

const getSeverityIcon = (severity: Issue['severity']) => {
  switch (severity) {
    case IssueSeverity.CRITICAL:
      return <CriticalIcon />;
    case IssueSeverity.MAJOR:
      return <HighIcon />;
    case IssueSeverity.MINOR:
      return <MediumIcon />;
    case IssueSeverity.INFO:
      return <LowIcon />;
    default:
      return <UnknownIcon />;
  }
};

interface LatestIssuesCardProps {
  className?: string;
}

const formatTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? dateTimeFormatter.format(date) : 'Invalid Date';
};

export const LatestIssuesCard: React.FC<LatestIssuesCardProps> = ({ className }) => {
  const namespace = useNamespace();
  const { data, isLoading, error } = useIssues({
    namespace,
    state: IssueState.ACTIVE,
    limit: 10,
  });

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, !isLoading, 'issues');
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
                        <Text component={TextVariants.h4} className="latest-issues-card__title">
                          {issue.title}
                        </Text>
                      </FlexItem>
                    </Flex>
                    <Text className="latest-issues-card__description">{issue.description}</Text>
                    <Text component={TextVariants.small} className="latest-issues-card__timestamp">
                      {formatTimestamp(issue.detectedAt)}
                    </Text>
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
          <AppEmptyState emptyStateImg={EmptySearchImgUrl} title="No issues found">
            <EmptyStateBody>No active issues found for this namespace.</EmptyStateBody>
          </AppEmptyState>
        )}
      </CardBody>
    </Card>
  );
};
