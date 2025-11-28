import {
  Card,
  CardBody,
  CardTitle,
  HelperText,
  Split,
  SplitItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { LockOpenIcon } from '@patternfly/react-icons/dist/esm/icons/lock-open-icon';
import { global_palette_green_400 as greenColor } from '@patternfly/react-tokens/dist/js/global_palette_green_400';
import dayjs from 'dayjs';
import { useIssues } from '~/kite/kite-hooks';
import { LoadingSkeleton } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { Issue, IssueState } from '../../kite/issue-type';

const getOpenIssueCount = (issues: Issue[]) => {
  return issues.filter((issue) => issue.state === IssueState.ACTIVE).length;
};

const getResolvedIssuesInLast24Hours = (issues: Issue[]) => {
  // Filters RESOLVED
  const resolved = issues.filter((issue) => issue.state === IssueState.RESOLVED);

  // Filters by time
  const twentyFourHoursAgo = dayjs().subtract(24, 'hours');
  const resolvedIssues = resolved.filter((issue) => {
    const issueUpdatedAt = dayjs(issue.updatedAt);
    const isWithinLast24Hours = issueUpdatedAt.isAfter(twentyFourHoursAgo);

    return isWithinLast24Hours && issue;
  });

  return resolvedIssues.length;
};

const IssuesByStatusCard = () => {
  const namespace = useNamespace();
  const { data, isLoading, error } = useIssues({ namespace });

  const issues = data?.data ?? [];

  return (
    <Card>
      <CardTitle>Issues by status</CardTitle>
      <CardBody>
        {error ? (
          getErrorState(error, !isLoading, 'issues', true)
        ) : (
          <Split hasGutter>
            <SplitItem>
              <TextContent>
                <Text component={TextVariants.h6}>
                  <LockOpenIcon /> Open
                </Text>
              </TextContent>
              {isLoading ? (
                <LoadingSkeleton count={1} widths="100%" height="16px" />
              ) : (
                <HelperText>{getOpenIssueCount(issues)} open as of today</HelperText>
              )}
            </SplitItem>

            <SplitItem style={{ paddingLeft: '1rem' }}>
              <TextContent>
                <Text component={TextVariants.h6}>
                  <CheckCircleIcon color={greenColor.value} /> Resolved
                </Text>
              </TextContent>
              {isLoading ? (
                <LoadingSkeleton count={1} widths="100%" height="16px" />
              ) : (
                <HelperText>
                  {getResolvedIssuesInLast24Hours(issues)} resolved in last 24 hours
                </HelperText>
              )}
            </SplitItem>
          </Split>
        )}
      </CardBody>
    </Card>
  );
};

export default IssuesByStatusCard;
