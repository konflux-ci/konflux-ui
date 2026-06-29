import React from 'react';
import { Icon } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IssueSeverity, IssueState } from '~/kite/issue-type';
import { useIssuesWithSeverity } from '~/kite/kite-hooks';

const SEVERITIES = [IssueSeverity.CRITICAL, IssueSeverity.MAJOR];

export const IssuesNavItemContent: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { data, isLoaded, hasError } = useIssuesWithSeverity(
    namespace,
    SEVERITIES,
    true, // noRefetch
  );

  const statusIcon = React.useMemo(() => {
    if (!isLoaded || hasError) {
      return null;
    }

    // Find critical and major severity groups
    const criticalGroup = data.find((group) => group.severity === IssueSeverity.CRITICAL);
    const majorGroup = data.find((group) => group.severity === IssueSeverity.MAJOR);

    // Check if there are active critical issues
    const hasCriticalIssues = criticalGroup?.issues.some(
      (issue) => issue.state === IssueState.ACTIVE,
    );

    if (hasCriticalIssues) {
      return (
        <Icon status="danger" data-test="critical-issues-icon" aria-label="Critical issues present">
          <ExclamationCircleIcon />
        </Icon>
      );
    }

    // Check if there are active major issues
    const hasMajorIssues = majorGroup?.issues.some((issue) => issue.state === IssueState.ACTIVE);

    if (hasMajorIssues) {
      return (
        <Icon status="warning" data-test="major-issues-icon" aria-label="Major issues present">
          <ExclamationTriangleIcon />
        </Icon>
      );
    }

    return null;
  }, [isLoaded, hasError, data]);

  return (
    <>
      Issues <FeatureFlagIndicator flags={['issues-dashboard']} />
      {statusIcon}
    </>
  );
};
