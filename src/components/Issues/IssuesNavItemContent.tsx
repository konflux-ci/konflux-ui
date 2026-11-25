import * as React from 'react';
import { IssueSeverity } from '~/kite/issue-type';
import { useCriticalAndMajorIssues } from '~/kite/kite-hooks';
import { ErrorIcon, WarningIcon } from '~/shared/components/status/icons';

const IssuesNavItemContent: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { data, isLoaded, hasError } = useCriticalAndMajorIssues(
    namespace,
    true, // noRefetch
  );

  if (!isLoaded || hasError) {
    return null;
  }

  // Find critical and major severity groups
  const criticalGroup = data.find((group) => group.severity === IssueSeverity.CRITICAL);
  const majorGroup = data.find((group) => group.severity === IssueSeverity.MAJOR);

  // Check if there are critical issues (already filtered to ACTIVE by the API)
  const hasCriticalIssues = (criticalGroup?.total ?? 0) > 0;

  if (hasCriticalIssues) {
    return (
      <ErrorIcon
        data-test="critical-issues-icon"
        aria-label="Critical issues present"
        className="pf-v6-u-ml-sm"
        style={{ alignSelf: 'center' }}
      />
    );
  }

  // Check if there are major issues (already filtered to ACTIVE by the API)
  const hasMajorIssues = (majorGroup?.total ?? 0) > 0;

  if (hasMajorIssues) {
    return (
      <WarningIcon
        data-test="major-issues-icon"
        aria-label="Major issues present"
        className="pf-v6-u-ml-sm"
        style={{ alignSelf: 'center' }}
      />
    );
  }

  return null;
};

export default React.memo(IssuesNavItemContent);
