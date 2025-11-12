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
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { getErrorState } from '~/shared/utils/error-utils';
import { useNamespace } from '../../shared/providers/Namespace';

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

export const LatestIssuesCard: React.FC = () => {
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
    <Card>
      <CardHeader>
        <CardTitle component="h3">Latest issues</CardTitle>
      </CardHeader>
      <CardBody>
        {hasIssues ? (
          <>
            <List isPlain>
              {issues.map((issue) => (
                <ListItem key={issue.id}>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <FlexItem
                      shrink={{ default: 'shrink' }}
                      alignSelf={{ default: 'alignSelfFlexStart' }}
                    >
                      {getSeverityIcon(issue.severity)}
                    </FlexItem>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Button
                        variant="link"
                        isInline
                        component={(props) => <Link {...props} to={`/issues/${issue.id}`} />}
                      >
                        <Text component={TextVariants.h3}>{issue.title}</Text>
                      </Button>
                    </FlexItem>
                  </Flex>
                  <Text
                    component={TextVariants.p}
                    color="subtle"
                    className="pf-v5-u-mt-sm pf-v5-u-mb-md"
                  >
                    {issue.description}
                  </Text>
                  <Text component={TextVariants.small} color="subtle" className="pf-v5-u-mt-sm">
                    <Timestamp timestamp={issue.detectedAt} />
                  </Text>
                </ListItem>
              ))}
            </List>
            <Button
              variant="link"
              isInline
              component={(props) => <Link {...props} to="/issues/list" />}
            >
              View all issues <ArrowRightIcon />
            </Button>
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
