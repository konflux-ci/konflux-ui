import * as React from 'react';
import { Icon } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { IssueSeverity } from '~/kite/issue-type';
import { useCriticalAndMajorIssues } from '~/kite/kite-hooks';
import { WarningIcon } from '~/shared/components/status/icons';

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
      <Icon
        status="danger"
        data-test="critical-issues-icon"
        aria-label="Critical issues present"
        className="pf-v6-u-ml-sm"
      >
        <ExclamationCircleIcon />
      </Icon>
    );
  }

  // Check if there are major issues (already filtered to ACTIVE by the API)
  const hasMajorIssues = (majorGroup?.total ?? 0) > 0;

  if (hasMajorIssues) {
    return <WarningIcon data-test="major-issues-icon" aria-label="Major issues present" />;
  }

  return null;
};

export default React.memo(IssuesNavItemContent);
