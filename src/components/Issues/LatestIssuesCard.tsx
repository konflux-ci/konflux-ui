import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Flex,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  Text,
  TextContent,
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
import { ISSUES_LIST_PATH } from '~/routes/paths';
import { LoadingSkeleton } from '~/shared';
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
  const issues = data?.data ?? [];
  const hasIssues = issues.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle component="h3">Latest issues</CardTitle>
      </CardHeader>
      <CardBody>
        {error && !isLoading ? (
          getErrorState(error, !isLoading, 'issues', true)
        ) : isLoading ? (
          <LoadingSkeleton
            count={5}
            height="1.25rem"
            widths="80%"
            data-test="loading-skeleton-latest-issues"
          />
        ) : hasIssues ? (
          <List isPlain>
            {issues.map((issue) => (
              <ListItem key={issue.id} icon={getSeverityIcon(issue.severity)}>
                <Flex
                  direction={{ default: 'column' }}
                  alignItems={{ default: 'alignItemsFlexStart' }}
                >
                  <TextContent style={{ marginBlockEnd: 0 }}>
                    <Text component={TextVariants.h6}>{issue.title}</Text>
                  </TextContent>
                  <HelperText>
                    <HelperTextItem variant="default">{issue.description}</HelperTextItem>
                  </HelperText>
                  <Text component={TextVariants.small}>
                    <Timestamp timestamp={issue.detectedAt} />
                  </Text>
                </Flex>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text component={TextVariants.p}>No active issues found for this namespace.</Text>
        )}
      </CardBody>
      <CardFooter>
        <Button
          variant="link"
          isInline
          component={(props) => (
            <Link {...props} to={ISSUES_LIST_PATH.createPath({ workspaceName: namespace })} />
          )}
        >
          View all issues <ArrowRightIcon />
        </Button>
      </CardFooter>
    </Card>
  );
};
