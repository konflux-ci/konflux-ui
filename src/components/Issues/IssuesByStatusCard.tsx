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
import { Issue, IssuesByStatusCardProps, IssueState } from '../../kite/issue-type';

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

const IssuesByStatusCard = ({ issues }: IssuesByStatusCardProps) => {
  return (
    <Card>
      <CardTitle>Issues by status</CardTitle>
      <CardBody>
        <Split hasGutter>
          <SplitItem>
            <TextContent>
              <Text component={TextVariants.h6}>
                <LockOpenIcon /> Open
              </Text>
            </TextContent>
            <HelperText>{getOpenIssueCount(issues)} open as of today</HelperText>
          </SplitItem>

          <SplitItem style={{ paddingLeft: '1rem' }}>
            <TextContent>
              <Text component={TextVariants.h6}>
                <CheckCircleIcon color={greenColor.value} /> Resolved
              </Text>
            </TextContent>
            <HelperText>
              {getResolvedIssuesInLast24Hours(issues)} resolved in last 24 hours
            </HelperText>
          </SplitItem>
        </Split>
      </CardBody>
    </Card>
  );
};

export default IssuesByStatusCard;
