import React from 'react';
import { Icon } from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IssueSeverity, IssueState } from '~/kite/issue-type';
import { useIssues } from '~/kite/kite-hooks';

export const IssueNavItemContent: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { data: issuesData, isLoading, error } = useIssues({ namespace });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const issues = issuesData?.data || [];

  const statusIcon = React.useMemo(() => {
    if (isLoading || error) {
      return null;
    }

    const hasCriticalIssues = issues.find(
      (issue) => issue.severity === IssueSeverity.CRITICAL && issue.state !== IssueState.RESOLVED,
    );
    if (hasCriticalIssues) {
      return (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      );
    }
    const hasMajorIssues = issues.find(
      (issue) => issue.severity === IssueSeverity.MAJOR && issue.state !== IssueState.RESOLVED,
    );
    if (hasMajorIssues) {
      return (
        <Icon status="warning">
          <ExclamationTriangleIcon />
        </Icon>
      );
    }
    return null;
  }, [isLoading, error, issues]);

  return (
    <>
      Issues <FeatureFlagIndicator flags={['issues-dashboard']} />
      {statusIcon}
    </>
  );
};
